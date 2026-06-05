#!/bin/bash

REPO_DIR="/home/artur/homeserver-pi"
LOG_FILE="/home/artur/homeserver-pi/deploy.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

cd "$REPO_DIR" || exit 1

# Pobierz info o zdalnym repo bez mergowania
git fetch origin main 2>/dev/null

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
    exit 0  # Brak zmian, nic nie rób
fi

log "Wykryto nową wersję ($LOCAL → $REMOTE), aktualizuję..."

git pull origin main >> "$LOG_FILE" 2>&1

sudo cp index.html /var/www/html/index.html
log "index.html zaktualizowany"

sudo systemctl restart wol-backend
log "wol-backend zrestartowany"

log "Deploy zakończony pomyślnie"
