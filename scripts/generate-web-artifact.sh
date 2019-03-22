#!/bin/bash
set -euo pipefail

# NOTE: this script should be ran from the root of the repository; the CWD should reflect this
VERSION=$(node -pe "require('./package.json').version")
COMMIT_SHA=$(git rev-parse --short HEAD)

echo "cwd=$(pwd)"
echo "version=${VERSION}"
echo "commit=${COMMIT_SHA}"

# use by web pack
export REACT_APP_VERSION=${VERSION}
export REACT_APP_COMMIT_SHA=${COMMIT_SHA}

# npm install will be in a standalone task
npm run release-web
