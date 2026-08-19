#!/usr/bin/env bash

set -euo pipefail

SOURCE_IMAGE="pasteboard:latest"
REPOSITORY="guoqiao/pasteboard"

usage() {
    printf 'Usage: %s [TAG]\n' "$0" >&2
    printf 'Example: %s v0.0.0\n' "$0" >&2
}

if [[ $# -gt 1 ]]; then
    usage
    exit 2
fi

TAG="${1:-latest}"
TARGET_IMAGE="$REPOSITORY:$TAG"

if ! docker image inspect "$SOURCE_IMAGE" >/dev/null 2>&1; then
    printf 'Local image not found: %s\n' "$SOURCE_IMAGE" >&2
    printf 'Build it first with: make build\n' >&2
    exit 1
fi

docker tag "$SOURCE_IMAGE" "$TARGET_IMAGE"
docker push "$TARGET_IMAGE"

printf 'Pushed %s\n' "$TARGET_IMAGE"
