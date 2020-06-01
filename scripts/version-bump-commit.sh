#!/bin/bash
set -euo pipefail

NPM_VERSION_TYPE=${1:-"prepatch --preid=preview"}
echo "Next version type: ----->$NPM_VERSION_TYPE<-----"

PACKAGE_VERSION=$(node -pe "require('./package.json').version")
CURRENT_VERSION="v$PACKAGE_VERSION"

# Get full branch name excluding refs/head from the env var SOURCE_BRANCH
SOURCE_BRANCH_NAME=${SOURCE_BRANCH/refs\/heads\/}

# Configure git to commit as VoTT Service Account
echo "Configuring git to use deploy key..."
git config --local user.email "vott@microsoft.com"
git config --local user.name "Vott"

echo "SOURCE_BRANCH: ${SOURCE_BRANCH_NAME}"
git pull origin ${SOURCE_BRANCH_NAME}
git checkout ${SOURCE_BRANCH_NAME}
echo "Checked out branch: ${SOURCE_BRANCH_NAME}"

## format: v2.2.0
NEXT_VERSION=`npm version ${NPM_VERSION_TYPE} -m "release: Update ${NPM_VERSION_TYPE} version to %s ***NO_CI***"`
echo "Set next version to: ${NEXT_VERSION}"

# There is currently no way to pass variables between stages, hence this workaround
echo
echo "##vso[task.setvariable variable=NEXT_VERSION]$NEXT_VERSION"
echo "##vso[task.setvariable variable=CURRENT_VERSION]$CURRENT_VERSION"

#### Push new tag
SHA=`git rev-parse HEAD`

export GIT_SSH_COMMAND="ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no"
git remote add authOrigin git@github.com:microsoft/VoTT.git
git push authOrigin ${SOURCE_BRANCH_NAME} --tags

echo
echo "Pushed new tag: ${NEXT_VERSION} @ SHA: ${SHA:0:8}"
