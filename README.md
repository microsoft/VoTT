# VoTT (Visual Object Tagging Tool)

[![Build Status](https://dev.azure.com/msft-vott/VoTT/_apis/build/status/VoTT-CI?branchName=v2)](https://dev.azure.com/msft-vott/VoTT/_build/latest?definitionId=6?branchName=v2) [![Code Coverage](https://codecov.io/gh/Microsoft/VoTT/branch/v2/graph/badge.svg)](https://codecov.io/gh/Microsoft/VoTT)

[CODE COMPLEXITY](https://microsoft.github.io/VoTT/)

The `v2` branch is a complete reboot of the original VoTT, and currently don't share git histories. The purpose of `v2` is to create a more extensible version of the original application while leveraging more recent frameworks such as React/Redux.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app). For available scripts and other related info, see [our docs](docs/REACTAPP.md).

## Contributing Guidelines

We welcome [issues](https://github.com/Microsoft/VoTT/issues) and [pull requests](https://github.com/Microsoft/VoTT/pulls) into the project. We ask that you follow these simple guidelines:

### Issues

- Look for duplicate issues & comment on thread if experiencing something similar
- Fill in template information (platform, OS, version, screenshots, etc.)

### Pull Requests

1. Find an issue to work on, or create a new one
2. Fork repo, make sure you have latest changes from `v2`
3. Create branch following naming convention: `git checkout -b issue-<###>-<short-description>`.
4. Write code
5. Add unit tests
6. Verify linting and unit tests by running `npm test`
7. Update docs if needed
8. Rebase on `v2` and resolve conflicts
9. Submit PR to `v2` branch

Try to keep PRs small to decrease the time required to review and merge

### Style

1. This repo use EditorConfig to maintain consistent style, please refer to
   this [guide](docs/STYLE.md) for more information.

### Code complexity

1. You can view the latest code analysis report [here](https://microsoft.github.io/VoTT/)
1. More info about the analysi tool [here](docs/PLATO.md)

## Usage

For those who just want to use VoTT rather than contributing to it, you have two options:

### Download and install release package for your environment (recommended)

   Find our [most recent release](https://github.com/Microsoft/VoTT/releases), download and run. `v2` releases will be prefixed by `2.x`.

#### Clone repo and run from terminal using `npm`

   Run the following commands in your terminal:

   ```bash
    git clone https://github.com/Microsoft/VoTT
    cd VoTT
    git checkout v2
    npm install
    npm start
   ```

   **Important to note that when running with `npm`, both the electron and the browser versions of the application will start. One major difference is that electron can access the local file system.**
