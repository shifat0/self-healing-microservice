.PHONY: start stop restart build logs ps

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
