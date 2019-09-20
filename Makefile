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

version: check-env
	@echo $(VERSION)

init:
	cp .env.sample .env

vars: check-env
	@echo '  Version: $(VERSION)'
	@echo ''
	@echo 'Sensible defaults values (for local dev)'
	@echo '  DEV_VOTT_PORT=${DEV_VOTT_PORT}'
	@echo '  DOCKER_TAG=${DOCKER_TAG}'
	@echo '  PUBLIC_URL=${PUBLIC_URL}'
	@echo ''
	@echo 'For deployment purpose'
	@echo '  SUBDOMAIN=${SUBDOMAIN}'
	@echo '  DOMAIN=${DOMAIN}'
	@echo '  STACK_NAME=${STACK_NAME}'
	@echo '  TRAEFIK_PUBLIC_NETWORK=${TRAEFIK_PUBLIC_NETWORK}'
	@echo '  TRAEFIK_PUBLIC_TAG=${TRAEFIK_PUBLIC_TAG}'

deploy:
ifeq ($(wildcard docker-stack.yml),)
	@echo "docker-stack.yml file is missing. call push-* first"
	@exit 1
endif
	docker-auto-labels docker-stack.yml
	docker stack deploy -c docker-stack.yml --with-registry-auth ${STACK_NAME}

push-prod: login
	# update tags
	git tag -f prod
	git push --tags --force

	# build and push docker image
	DOCKER_TAG=prod PUBLIC_URL=vott.${DOMAIN} docker-compose -f docker-compose.deploy.yml build
	DOCKER_TAG=prod docker-compose push

deploy-prod:
	DOCKER_TAG=prod  \
		SUBDOMAIN=vott \
		DOMAIN=${DOMAIN} \
		TRAEFIK_PUBLIC_TAG=${TRAEFIK_PUBLIC_TAG} \
		STACK_NAME=${STACK_NAME} \
		docker-compose \
			-f docker-compose.deploy.yml \
			-f docker-compose.deploy.networks.yml \
		config > docker-stack.yml
	make deploy

push-qa: login
	# update tags
	git tag -f stag
	git push --tags --force

	# build docker image
	DOCKER_TAG=stag PUBLIC_URL=vott-qa.${DOMAIN} docker-compose -f docker-compose.deploy.yml build
	DOCKER_TAG=stag docker-compose push

deploy-qa:
	DOCKER_TAG=stag \
		SUBDOMAIN=vott-qa \
		DOMAIN=${DOMAIN} \
		TRAEFIK_PUBLIC_TAG=${TRAEFIK_PUBLIC_TAG} \
		STACK_NAME=${STACK_NAME} \
			-f docker-compose.deploy.yml \
			-f docker-compose.deploy.networks.yml \
		config > docker-stack.yml
	make deploy

push-int: login
	# update tags
	git tag -f latest
	git push --tags --force

	# build docker image
	DOCKER_TAG=latest PUBLIC_URL=vott-dev.${DOMAIN} docker-compose -f docker-compose.deploy.yml build
	DOCKER_TAG=latest docker-compose push

deploy-int:
	DOCKER_TAG=latest \
		SUBDOMAIN=vott-dev \
		DOMAIN=${DOMAIN} \
		TRAEFIK_PUBLIC_TAG=${TRAEFIK_PUBLIC_TAG} \
		STACK_NAME=${STACK_NAME} \
			-f docker-compose.deploy.yml \
			-f docker-compose.deploy.networks.yml \
		config > docker-stack.yml
	make deploy

# docker shortcuts for maintenance purpose

login:
	docker login

ps:
	docker ps --format 'table {{.Image}}\t{{.Status}}\t{{.Ports}}\t{{.Names}}'


# docker shortcuts for development purpose

up: check-env
	docker-compose -f docker-compose.dev.yml up -d

down:
	docker-compose -f docker-compose.dev.yml down

stop:
	docker-compose -f docker-compose.dev.yml stop

logs:
	docker-compose -f docker-compose.dev.yml logs --tail 20 -f

build: check-env
	rm -rf build node_modules
	docker-compose -f docker-compose.dev.yml build --pull

