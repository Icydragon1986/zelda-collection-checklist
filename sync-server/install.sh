#!/bin/sh
set -eu

SERVICE_NAME="triforce-sync"
SERVICE_USER="triforce-sync"
APP_DIR="/opt/triforce-sync"
DATA_DIR="/var/lib/triforce-sync"
CONFIG_DIR="/etc/triforce-sync"
TOKEN_FILE="$CONFIG_DIR/token"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

if [ "$(id -u)" -ne 0 ]; then
  echo "Cet installateur doit etre lance avec sudo." >&2
  exit 1
fi

if [ ! -f "$SCRIPT_DIR/triforce_sync_server.py" ] || [ ! -f "$SCRIPT_DIR/triforce-sync.service" ]; then
  echo "Les fichiers du serveur sont incomplets." >&2
  exit 1
fi

if ! getent group "$SERVICE_USER" >/dev/null 2>&1; then
  addgroup --system "$SERVICE_USER"
fi

if ! id "$SERVICE_USER" >/dev/null 2>&1; then
  adduser --system --ingroup "$SERVICE_USER" --no-create-home \
    --home /nonexistent --shell /usr/sbin/nologin "$SERVICE_USER"
fi

install -d -o root -g root -m 0755 "$APP_DIR"
install -d -o "$SERVICE_USER" -g "$SERVICE_USER" -m 0750 "$DATA_DIR"
install -d -o root -g "$SERVICE_USER" -m 0750 "$CONFIG_DIR"

install -o root -g root -m 0644 \
  "$SCRIPT_DIR/triforce_sync_server.py" "$APP_DIR/triforce_sync_server.py"
install -o root -g root -m 0644 \
  "$SCRIPT_DIR/triforce-sync.service" "/etc/systemd/system/$SERVICE_NAME.service"

if [ ! -s "$TOKEN_FILE" ]; then
  umask 0077
  /usr/bin/python3 -c 'import secrets; print(secrets.token_urlsafe(48))' > "$TOKEN_FILE"
fi
chown root:"$SERVICE_USER" "$TOKEN_FILE"
chmod 0640 "$TOKEN_FILE"

systemctl daemon-reload
systemctl enable "$SERVICE_NAME.service"
systemctl restart "$SERVICE_NAME.service"

for attempt in 1 2 3 4 5; do
  if /usr/bin/curl --silent --fail --max-time 2 http://127.0.0.1:8788/health >/dev/null; then
    echo "Triforce Sync est actif sur 127.0.0.1:8788."
    echo "Le jeton existant a ete conserve s'il etait deja present."
    exit 0
  fi
  sleep 1
done

echo "Le service n'a pas repondu. Consultez: systemctl status $SERVICE_NAME" >&2
exit 1
