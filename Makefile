.PHONY: start stop restart build logs ps

start:
	docker-compose up --build -d

stop:
	docker-compose down

restart: stop start

build:
	docker-compose build

logs:
	docker-compose logs -f

ps:
	docker-compose ps
