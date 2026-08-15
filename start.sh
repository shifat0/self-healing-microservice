#!/usr/bin/env bash
set -euo pipefail

run_docker() {
  if command -v docker-compose >/dev/null 2>&1; then
    docker-compose "$@"
  else
    docker compose "$@"
  fi
}

CMD=${1:-start}

case "$CMD" in
  start)
    run_docker up --build -d
    ;;
  stop)
    run_docker down
    ;;
  restart)
    run_docker down && run_docker up --build -d
    ;;
  build)
    run_docker build --parallel
    ;;
  logs)
    run_docker logs -f
    ;;
  ps)
    run_docker ps
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|build|logs|ps}"
    exit 1
    ;;
esac
