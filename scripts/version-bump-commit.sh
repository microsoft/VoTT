#!/bin/bash
set -euo pipefail

NPM_RELEASE_TYPE=${1-"prepatch --preid=preview"}

# Get full branch name excluding refs/head from the env var SOURCE_BRANCH
SOURCE_BRANCH_NAME=${SOURCE_BRANCH/refs\/heads\/}

# Configure git to commit as SLS Azure Functions Service Account
echo "Configuring git to use deploy key..."
git config --local user.email "vott@microsoft.com"
git config --local user.name "Vott"

echo "SOURCE_BRANCH: ${SOURCE_BRANCH_NAME}"
git pull origin ${SOURCE_BRANCH_NAME}
git checkout ${SOURCE_BRANCH_NAME}
echo "Checked out branch: ${SOURCE_BRANCH_NAME}"

NPM_VERSION=`npm version ${NPM_RELEASE_TYPE} -m "release: Update ${NPM_RELEASE_TYPE} version to %s ***NO_CI***"`
echo "Set NPM version to: ${NPM_VERSION}"

SHA=`git rev-parse HEAD`

export GIT_SSH_COMMAND="ssh -vvv -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no"
git remote add authOrigin git@github.com:microsoft/VoTT.git
git push authOrigin ${SOURCE_BRANCH_NAME} --tags

echo "Pushed new tag: ${NPM_VERSION} @ SHA: ${SHA:0:8}"
