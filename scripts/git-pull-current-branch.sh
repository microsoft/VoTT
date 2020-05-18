#!/bin/bash
set -euo pipefail

# Get full branch name excluding refs/head from the env var SOURCE_BRANCH
SOURCE_BRANCH_NAME=${SOURCE_BRANCH/refs\/heads\/}

echo "SOURCE_BRANCH: ${SOURCE_BRANCH_NAME}"
git pull origin ${SOURCE_BRANCH_NAME}
git checkout ${SOURCE_BRANCH_NAME}
echo "Checked out branch: ${SOURCE_BRANCH_NAME}"
