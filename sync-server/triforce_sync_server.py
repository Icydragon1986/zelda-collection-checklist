#!/usr/bin/env python3
"""Minimal encrypted-snapshot sync server for Triforce Checklist.

The clients encrypt collection data before upload. This service only stores an
opaque payload and an optimistic-concurrency revision in SQLite.
"""

from __future__ import annotations

import hmac
import json
import os
import sqlite3
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Optional, Set


SERVER_VERSION = "1"
MAX_BODY_BYTES = 1_048_576
MAX_PAYLOAD_CHARS = 900_000


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def read_token(path: str) -> str:
    token = Path(path).read_text(encoding="utf-8").strip()
    if len(token) < 32:
        raise RuntimeError("TRIFORCE_SYNC_TOKEN_FILE must contain at least 32 characters")
    return token


def initialize_database(path: str) -> None:
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(path) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS snapshot (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                revision INTEGER NOT NULL,
                payload TEXT,
                device_id TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        connection.execute(
            """
            INSERT OR IGNORE INTO snapshot (id, revision, payload, device_id, updated_at)
            VALUES (1, 0, NULL, '', ?)
            """,
            (utc_now(),),
        )


class SyncServer(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True

    def __init__(
        self,
        server_address: tuple[str, int],
        database_path: str,
        token: str,
        allowed_origins: Set[str],
        base_path: str = "",
    ) -> None:
        self.database_path = database_path
        self.token = token
        self.allowed_origins = allowed_origins
        self.base_path = base_path.rstrip("/")
        initialize_database(database_path)
        super().__init__(server_address, SyncRequestHandler)


class SyncRequestHandler(BaseHTTPRequestHandler):
    server: SyncServer
    server_version = "TriforceSync"
    sys_version = ""

    def log_message(self, fmt: str, *args: Any) -> None:
        # Request paths are safe to log; authorization headers and bodies are never logged.
        print(f"{self.address_string()} - {fmt % args}")

    def _origin(self) -> Optional[str]:
        return self.headers.get("Origin")

    def _route(self) -> str:
        route = self.path.split("?", 1)[0]
        prefix = self.server.base_path
        if prefix and (route == prefix or route.startswith(f"{prefix}/")):
            return route[len(prefix):] or "/"
        return route

    def _origin_allowed(self) -> bool:
        origin = self._origin()
        return origin is None or origin in self.server.allowed_origins

    def _cors_headers(self) -> dict[str, str]:
        origin = self._origin()
        if origin and origin in self.server.allowed_origins:
            return {
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
                "Access-Control-Allow-Headers": "Authorization, Content-Type",
                "Access-Control-Max-Age": "86400",
                "Vary": "Origin",
            }
        return {}

    def _send_json(self, status: HTTPStatus, body: dict[str, Any]) -> None:
        encoded = json.dumps(body, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        for name, value in self._cors_headers().items():
            self.send_header(name, value)
        self.end_headers()
        self.wfile.write(encoded)

    def _reject_bad_origin(self) -> bool:
        if self._origin_allowed():
            return False
        self._send_json(HTTPStatus.FORBIDDEN, {"error": "origin-not-allowed"})
        return True

    def _authorized(self) -> bool:
        prefix = "Bearer "
        header = self.headers.get("Authorization", "")
        supplied = header[len(prefix):] if header.startswith(prefix) else ""
        return hmac.compare_digest(supplied, self.server.token)

    def _require_authorization(self) -> bool:
        if self._authorized():
            return True
        self._send_json(HTTPStatus.UNAUTHORIZED, {"error": "unauthorized"})
        return False

    def _read_json(self) -> Optional[dict[str, Any]]:
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "invalid-content-length"})
            return None
        if length <= 0 or length > MAX_BODY_BYTES:
            self._send_json(HTTPStatus.REQUEST_ENTITY_TOO_LARGE, {"error": "body-too-large"})
            return None
        try:
            value = json.loads(self.rfile.read(length).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "invalid-json"})
            return None
        if not isinstance(value, dict):
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "invalid-json"})
            return None
        return value

    def do_OPTIONS(self) -> None:  # noqa: N802
        if self._reject_bad_origin():
            return
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_header("Content-Length", "0")
        for name, value in self._cors_headers().items():
            self.send_header(name, value)
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        if self._reject_bad_origin():
            return
        route = self._route()
        if route == "/health":
            self._send_json(HTTPStatus.OK, {"ok": True, "version": SERVER_VERSION})
            return
        if route != "/v1/snapshot":
            self._send_json(HTTPStatus.NOT_FOUND, {"error": "not-found"})
            return
        if not self._require_authorization():
            return
        with sqlite3.connect(self.server.database_path) as connection:
            revision, payload, device_id, updated_at = connection.execute(
                "SELECT revision, payload, device_id, updated_at FROM snapshot WHERE id = 1"
            ).fetchone()
        self._send_json(
            HTTPStatus.OK,
            {
                "revision": revision,
                "payload": payload,
                "deviceId": device_id,
                "updatedAt": updated_at,
            },
        )

    def do_PUT(self) -> None:  # noqa: N802
        if self._reject_bad_origin():
            return
        if self._route() != "/v1/snapshot":
            self._send_json(HTTPStatus.NOT_FOUND, {"error": "not-found"})
            return
        if not self._require_authorization():
            return
        body = self._read_json()
        if body is None:
            return
        base_revision = body.get("baseRevision")
        payload = body.get("payload")
        device_id = body.get("deviceId")
        if not isinstance(base_revision, int) or base_revision < 0:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "invalid-revision"})
            return
        if not isinstance(payload, str) or not payload or len(payload) > MAX_PAYLOAD_CHARS:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "invalid-payload"})
            return
        if not isinstance(device_id, str) or not 1 <= len(device_id) <= 128:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "invalid-device"})
            return

        with sqlite3.connect(self.server.database_path, timeout=5) as connection:
            connection.execute("BEGIN IMMEDIATE")
            current_revision, current_payload, current_device, current_updated = connection.execute(
                "SELECT revision, payload, device_id, updated_at FROM snapshot WHERE id = 1"
            ).fetchone()
            if current_revision != base_revision:
                connection.rollback()
                self._send_json(
                    HTTPStatus.CONFLICT,
                    {
                        "error": "revision-conflict",
                        "revision": current_revision,
                        "payload": current_payload,
                        "deviceId": current_device,
                        "updatedAt": current_updated,
                    },
                )
                return
            next_revision = current_revision + 1
            updated_at = utc_now()
            connection.execute(
                """
                UPDATE snapshot
                SET revision = ?, payload = ?, device_id = ?, updated_at = ?
                WHERE id = 1
                """,
                (next_revision, payload, device_id, updated_at),
            )
            connection.commit()
        self._send_json(
            HTTPStatus.OK,
            {"revision": next_revision, "deviceId": device_id, "updatedAt": updated_at},
        )


def create_server(
    host: str,
    port: int,
    database_path: str,
    token_file: str,
    allowed_origins: Set[str],
    base_path: str = "",
) -> SyncServer:
    return SyncServer((host, port), database_path, read_token(token_file), allowed_origins, base_path)


def main() -> None:
    host = os.environ.get("TRIFORCE_SYNC_HOST", "127.0.0.1")
    port = int(os.environ.get("TRIFORCE_SYNC_PORT", "8788"))
    database_path = os.environ.get("TRIFORCE_SYNC_DATABASE", "/var/lib/triforce-sync/sync.sqlite3")
    token_file = os.environ.get("TRIFORCE_SYNC_TOKEN_FILE", "/etc/triforce-sync/token")
    base_path = os.environ.get("TRIFORCE_SYNC_BASE_PATH", "/checklist")
    allowed_origins = {
        origin.strip()
        for origin in os.environ.get(
            "TRIFORCE_SYNC_ORIGINS",
            "https://icydragon1986.github.io,http://tauri.localhost,https://tauri.localhost",
        ).split(",")
        if origin.strip()
    }
    server = create_server(host, port, database_path, token_file, allowed_origins, base_path)
    print(f"Triforce Sync {SERVER_VERSION} listening on http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
