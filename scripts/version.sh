#!/bin/bash
set -euo pipefail

# NOTE: this script should be ran from the root of the repository; the CWD should reflect this
VERSION=$(node -pe "require('./package.json').version")
COMMIT_SHA=$(git rev-parse --short HEAD)

echo "cwd=$(pwd)"
echo "version=${VERSION}"
echo "commit=${COMMIT_SHA}"

npm install replace-in-file --no-save
./node_modules/.bin/replace-in-file "%REACT_APP_VERSION%" ${VERSION} build/index.html
./node_modules/.bin/replace-in-file "%REACT_APP_COMMIT_SHA%" ${COMMIT_SHA} build/index.html
