import json
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from pathlib import Path

from triforce_sync_server import create_server


TOKEN = "test-token-that-is-longer-than-thirty-two-characters"
ORIGIN = "https://icydragon1986.github.io"


class SyncServerTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        root = Path(self.temp.name)
        token_path = root / "token"
        token_path.write_text(TOKEN, encoding="utf-8")
        self.server = create_server(
            "127.0.0.1",
            0,
            str(root / "sync.sqlite3"),
            str(token_path),
            {ORIGIN},
            "/checklist",
        )
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base_url = f"http://127.0.0.1:{self.server.server_port}"

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)
        self.temp.cleanup()

    def request(self, path, method="GET", body=None, token=TOKEN, origin=ORIGIN):
        headers = {"Origin": origin}
        if token is not None:
            headers["Authorization"] = f"Bearer {token}"
        data = None
        if body is not None:
            data = json.dumps(body).encode("utf-8")
            headers["Content-Type"] = "application/json"
        request = urllib.request.Request(
            self.base_url + path,
            data=data,
            headers=headers,
            method=method,
        )
        try:
            response = urllib.request.urlopen(request, timeout=2)
        except urllib.error.HTTPError as error:
            return error.code, json.loads(error.read())
        raw = response.read()
        return response.status, json.loads(raw) if raw else None

    def test_health_does_not_require_token(self):
        status, body = self.request("/checklist/health", token=None)
        self.assertEqual(status, 200)
        self.assertEqual(body, {"ok": True, "version": "1"})

        status, body = self.request("/health", token=None)
        self.assertEqual(status, 200)
        self.assertEqual(body, {"ok": True, "version": "1"})

    def test_snapshot_requires_token(self):
        status, body = self.request("/checklist/v1/snapshot", token="wrong-token")
        self.assertEqual(status, 401)
        self.assertEqual(body["error"], "unauthorized")

    def test_put_get_and_conflict(self):
        status, body = self.request(
            "/checklist/v1/snapshot",
            method="PUT",
            body={"baseRevision": 0, "payload": "v1.ciphertext", "deviceId": "desktop"},
        )
        self.assertEqual(status, 200)
        self.assertEqual(body["revision"], 1)

        status, body = self.request("/checklist/v1/snapshot")
        self.assertEqual(status, 200)
        self.assertEqual(body["payload"], "v1.ciphertext")
        self.assertEqual(body["deviceId"], "desktop")

        status, body = self.request(
            "/checklist/v1/snapshot",
            method="PUT",
            body={"baseRevision": 0, "payload": "v1.stale", "deviceId": "iphone"},
        )
        self.assertEqual(status, 409)
        self.assertEqual(body["revision"], 1)
        self.assertEqual(body["payload"], "v1.ciphertext")

    def test_rejects_unknown_origin(self):
        status, body = self.request("/checklist/health", token=None, origin="https://example.com")
        self.assertEqual(status, 403)
        self.assertEqual(body["error"], "origin-not-allowed")


if __name__ == "__main__":
    unittest.main()
