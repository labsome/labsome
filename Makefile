SRC_DIR := $(shell pwd)
DOCKER_IMAGE := warehaus/warehaus
FRONTEND_BUILDER_IMAGE := warehaus/frontend-builder:v13
TESTING_IMAGE := warehaus/testing:v1
DOCKER_RUN_CMDLINE := docker run -ti --rm
LOCAL_LOGS := $(shell echo ~/.warehaus/logs)

#---------------------------------------------------------------------
# Default target
#---------------------------------------------------------------------

default:
	@echo "Please run a specific make target"

#---------------------------------------------------------------------
# Frontend targets:
#
# build-frontend: Build the frontend by running the frontend-builder
# image with the sources mapped into /opt/warehaus. This works because
# the frontend builds into /static so we end up with everything built
# in the right place.
#
# frontend: Runs gulp to watch for changes.
#---------------------------------------------------------------------

RUN_FRONTEND_BUILDER_IMAGE := @$(DOCKER_RUN_CMDLINE) \
	--volume $(SRC_DIR):/build \
	$(FRONTEND_BUILDER_IMAGE) /bin/sh -c

build-frontend:
	@echo "Building frontend..."
	@$(RUN_FRONTEND_BUILDER_IMAGE) "cd /build/frontend && bower install --allow-root && gulp build"

frontend:
	@$(RUN_FRONTEND_BUILDER_IMAGE) "cd /build/frontend && bower install --allow-root && gulp"

.PHONY: frontend

#---------------------------------------------------------------------
# Docker image targets:
# Build and push the image based on the travis tag/branch. If none is
# found we stay with the dev tag, otherwise we push with a version
# tag and update latest.
#---------------------------------------------------------------------

docker-image: build-frontend
	@echo "Building Docker image..."
	@docker build -t $(DOCKER_IMAGE):dev .

push-docker-image: docker-image
	@docker login -e="$(DOCKER_EMAIL)" -u="$(DOCKER_USERNAME)" -p="$(DOCKER_PASSWORD)";
	@if [ ! -z "$(TRAVIS_TAG)" ]; then \
		echo "Tagging image: $(DOCKER_IMAGE):$(TRAVIS_TAG)"; \
		docker tag $(DOCKER_IMAGE):dev $(DOCKER_IMAGE):$(TRAVIS_TAG); \
		docker tag $(DOCKER_IMAGE):dev $(DOCKER_IMAGE):latest; \
		echo "Pushing image..."; \
		docker push $(DOCKER_IMAGE):$(TRAVIS_TAG); \
		docker push $(DOCKER_IMAGE):latest; \
	else \
		docker push $(DOCKER_IMAGE):dev; \
	fi

#---------------------------------------------------------------------
# Running and testing:
# Run and test using the latest built dev container. When testing we
# don't build first because it takes quite a lot of time, so it's
# assumed that tests are running with a command line such as:
#
#    make docker-image test
#
# and similarly for running.
#---------------------------------------------------------------------

RUN_DEV_IMAGE := $(DOCKER_RUN_CMDLINE) \
	--link rethinkdb \
	--volume $(SRC_DIR):/opt/warehaus \
	--volume $(LOCAL_LOGS):/var/log/warehaus \
	--publish 80:80 \
	$(DOCKER_IMAGE):dev

run:
	@echo "Running..."
	@mkdir -p $(LOCAL_LOGS)
	@$(RUN_DEV_IMAGE) warehaus --dev

src-test:
	@echo "Testing from sources..."
	@mkdir -p $(LOCAL_LOGS)
	@$(DOCKER_RUN_CMDLINE) \
		--volume $(SRC_DIR):/opt/warehaus \
		--volume /var/run/docker.sock:/var/run/docker.sock \
		--env TEST_IMAGE=$(DOCKER_IMAGE):dev \
		--env TEST_LOGS=$(LOCAL_LOGS) \
		--env SRC_DIR=$(SRC_DIR) \
		--env TEST_MODE=source \
		$(TESTING_IMAGE) py.test -v -x /opt/warehaus/tests

test:
	@echo "Testing..."
	@mkdir -p $(LOCAL_LOGS)
	@$(DOCKER_RUN_CMDLINE) \
		--volume $(SRC_DIR):/opt/warehaus \
		--volume /var/run/docker.sock:/var/run/docker.sock \
		--env TEST_IMAGE=$(DOCKER_IMAGE):dev \
		--env TEST_LOGS=$(LOCAL_LOGS) \
		$(TESTING_IMAGE) py.test -v /opt/warehaus/tests

#---------------------------------------------------------------------
# Shell:
# Run a shell inside our image with the sources mapped into
# /opt/warehaus but without building the image first.
# We're using the latest built dev image, which is useful for
# developing inside a container but we don't build because we're going
# to map the sources and install them in the container anyway.
#---------------------------------------------------------------------

shell:
	@$(RUN_DEV_IMAGE) /bin/bash
