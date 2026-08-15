#!/usr/bin/env bash
set -euo pipefail

CMD=${1:-start}

case "$CMD" in
  start)
    docker-compose up --build -d
    ;;
  stop)
    docker-compose down
    ;;
  restart)
    docker-compose down && docker-compose up --build -d
    ;;
  build)
    docker-compose build --parallel
    ;;
  logs)
    docker-compose logs -f
    ;;
  ps)
    docker-compose ps
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|build|logs|ps}"
    exit 1
    ;;
esac
