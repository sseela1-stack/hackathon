#!/usr/bin/env bash
set -euo pipefail

# Determine repo root relative to this script.
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
LOG_DIR="$ROOT_DIR"
PID_DIR="$ROOT_DIR/.pids"

BACKEND_PORT=3000
FRONTEND_PORT=3001
BACKEND_PID_FILE="$PID_DIR/backend-dev.pid"
FRONTEND_PID_FILE="$PID_DIR/frontend-dev.pid"

mkdir -p "$PID_DIR"

kill_pid_file() {
  local pid_file="$1"
  if [[ -f "$pid_file" ]]; then
    local pid
    pid="$(cat "$pid_file")"
    if [[ -n "$pid" ]]; then
      if kill -0 "$pid" >/dev/null 2>&1; then
        echo "Stopping process $pid from $pid_file"
        kill "$pid" >/dev/null 2>&1 || true
      fi
    fi
    rm -f "$pid_file"
  fi
}

kill_port() {
  local port="$1"
  if pids="$(lsof -ti "tcp:$port" 2>/dev/null)"; then
    for pid in $pids; do
      echo "Killing PID $pid using port $port"
      kill "$pid" >/dev/null 2>&1 || true
    done
  fi
}

start_backend() {
  echo "Starting backend dev server..."
  (cd "$BACKEND_DIR" && npm run dev > "$LOG_DIR/backend-dev.log" 2>&1 & echo $! > "$BACKEND_PID_FILE")
}

start_frontend() {
  echo "Starting frontend dev server..."
  (cd "$FRONTEND_DIR" && npm run dev > "$LOG_DIR/frontend-dev.log" 2>&1 & echo $! > "$FRONTEND_PID_FILE")
}

echo "Stopping existing dev servers (if any)..."
kill_pid_file "$BACKEND_PID_FILE"
kill_pid_file "$FRONTEND_PID_FILE"
kill_port "$BACKEND_PORT"
kill_port "$FRONTEND_PORT"

start_backend
start_frontend

echo "Servers restarted. Logs:"
echo "  Backend:  $LOG_DIR/backend-dev.log"
echo "  Frontend: $LOG_DIR/frontend-dev.log"
