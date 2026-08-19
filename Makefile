DOCKER ?= docker
IMAGE ?= pasteboard
TAG ?= latest

.PHONY: build run push

build:
	$(DOCKER) build -f Dockerfile.arm64 -t $(IMAGE):$(TAG) .

run: build
	@printf 'Pasteboard is available at http://localhost:3000\n'
	$(DOCKER) run --rm -p 3000:3000 \
		-v "$(CURDIR)/public/storage:/app/public/storage" \
		$(IMAGE):$(TAG)

push:
	bash docker_tag_and_push.sh latest
