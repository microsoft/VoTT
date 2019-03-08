#!/bin/bash
set -euo pipefail

# NOTE: this script should be ran from the root of the repository; the CWD should reflect this
VERSION=$(node -pe "require('./package.json').version")
COMMIT_SHA=$(git rev-parse --short HEAD)

echo "cwd=$(pwd)"
echo "version=${VERSION}"
echo "commit=${COMMIT_SHA}"


export REACT_APP_VERSION=${VERSION}
export REACT_APP_COMMIT_SHA=${COMMIT_SHA}

npm ci
npm run release-web

#NOTE: be sure to set AZURE_STORAGE_ACCOUNT and AZURE_STORAGE_KEY environment variables
# push VoTT SPA to blob - CLI will correctly take care of MIME types
az storage blob upload-batch -d '$web' -s build
