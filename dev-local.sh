#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$ROOT_DIR/.local-dev"
mkdir -p "$LOG_DIR"

USER_LOG="$LOG_DIR/user-service.log"
PROD_LOG="$LOG_DIR/product-service.log"
REM_LOG="$LOG_DIR/remediator.log"

start_service() {
  local name="$1"
  local dir="$2"
  local log_file="$3"
  local pid_file="$4"

  if [ -f "$pid_file" ] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
    echo "$name is already running (PID: $(cat "$pid_file"))"
    return 0
  fi

  echo "Starting $name in $dir"
  (cd "$dir" && nohup bash -lc "exec $5" >"$log_file" 2>&1 & echo $! > "$pid_file")
  echo "$name started with PID: $(cat "$pid_file")"
}

stop_service() {
  local name="$1"
  local pid_file="$2"

  if [ -f "$pid_file" ]; then
    local pid
    pid="$(cat "$pid_file")"
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid"
      echo "$name stopped"
    else
      echo "$name was not running"
    fi
    rm -f "$pid_file"
  else
    echo "$name is not running"
  fi
}

status_service() {
  local name="$1"
  local pid_file="$2"

  if [ -f "$pid_file" ] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
    echo "$name: running (PID $(cat "$pid_file"))"
  else
    echo "$name: stopped"
  fi
}

show_logs() {
  local log_file="$1"
  if [ -f "$log_file" ]; then
    echo "--- $log_file ---"
    tail -n 50 "$log_file"
  else
    echo "No log file found for $log_file"
  fi
}

case "${1:-up}" in
  up|start)
    start_service "user-service" "$ROOT_DIR/user-service" "$USER_LOG" "$LOG_DIR/user-service.pid" "npm run start:dev"
    start_service "product-service" "$ROOT_DIR/product-service" "$PROD_LOG" "$LOG_DIR/product-service.pid" "go run ."
    start_service "remediator" "$ROOT_DIR/remediator" "$REM_LOG" "$LOG_DIR/remediator.pid" "go run ."
    echo "Local dev services are running."
    echo "Check logs in $LOG_DIR"
    ;;
  down|stop)
    stop_service "user-service" "$LOG_DIR/user-service.pid"
    stop_service "product-service" "$LOG_DIR/product-service.pid"
    stop_service "remediator" "$LOG_DIR/remediator.pid"
    ;;
  status)
    status_service "user-service" "$LOG_DIR/user-service.pid"
    status_service "product-service" "$LOG_DIR/product-service.pid"
    status_service "remediator" "$LOG_DIR/remediator.pid"
    ;;
  logs)
    show_logs "$USER_LOG"
    show_logs "$PROD_LOG"
    show_logs "$REM_LOG"
    ;;
  *)
    echo "Usage: $0 {up|down|status|logs}"
    exit 1
    ;;
esac
