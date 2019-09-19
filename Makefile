#!make
# Default values, can be overridden either on the command line of make
# or in .env

VERSION:=$(shell node -pe "require('./package.json').version")

check-env:
ifeq ($(wildcard .env),)
	@echo ".env file is missing. Create it first"
	@exit 1
else
include .env
export
endif

version:
	@echo $(VERSION)


push-prod: login
	# update tags
	git tag -f prod
	git push --tags --force

	# build docker image
	DOCKER_TAG=prod docker-compose up --build -d

	# push image to docker
	docker push cortexia/vott:prod

push-qa: login
	# update tags
	git tag -f stag
	git push --tags --force

	# build docker image
	DOCKER_TAG=stag docker-compose up --build -d

	# push image to docker
	docker push cortexia/vott:stag

push-dev: login
	# update tags
	git tag -f latest
	git push --tags --force

	# build docker image
	DOCKER_TAG=latest docker-compose up --build -d

	# push image to docker
	docker push cortexia/vott:latest

# docker shortcuts for maintenance purpose

login:
	docker login

ps:
	docker ps --format 'table {{.Image}}\t{{.Status}}\t{{.Ports}}\t{{.Names}}'


# docker shortcuts for development purpose

up: check-env
	docker-compose -f docker-compose-dev.yaml up -d

down:
	docker-compose -f docker-compose-dev.yaml down

stop:
	docker-compose -f docker-compose-dev.yaml stop

logs:
	docker-compose -f docker-compose-dev.yaml logs --tail 20 -f

build: check-env
	rm -rf build node_modules
	docker-compose -f docker-compose-dev.yaml build --pull

