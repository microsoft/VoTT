#!/bin/bash
set -euo pipefail

# NOTE: this script should be ran from the root of the repository; the CWD should reflect this
VERSION=$(node -pe "require('./package.json').version")
COMMIT_SHA=$(git rev-parse --short HEAD)
NPM_BIN_DIR=$(npm bin)

echo "cwd=$(pwd)"
echo "version=${VERSION}"
echo "commit=${COMMIT_SHA}"

export REACT_APP_VERSION=${VERSION}
export REACT_APP_COMMIT_SHA=${COMMIT_SHA}

npx react-scripts build
npx webpack -p --config ./config/webpack.prod.js
npx electron-builder
