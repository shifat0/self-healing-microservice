.PHONY: start stop restart build logs ps dev-up dev-down dev-status dev-logs

DOCKER := $(shell if command -v docker-compose >/dev/null 2>&1; then echo docker-compose; else echo "docker compose"; fi)

start:
	$(DOCKER) up --build -d

stop:
	$(DOCKER) down

restart:
	$(DOCKER) down && $(DOCKER) up --build -d

build:
	$(DOCKER) build

logs:
	$(DOCKER) logs -f

ps:
	$(DOCKER) ps

dev-up:
	@./dev-local.sh up

dev-down:
	@./dev-local.sh down

dev-status:
	@./dev-local.sh status

dev-logs:
	@./dev-local.sh logs
