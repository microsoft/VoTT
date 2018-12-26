# VoTT - Open Source

[![Build Status](https://dev.azure.com/msft-vott/VoTT/_apis/build/status/VoTT-CI?branchName=v2)](https://dev.azure.com/msft-vott/VoTT/_build/latest?definitionId=6?branchName=v2)

The `v2` branch is a complete reboot of the original VoTT, and currently don't share git histories. The purpose of `v2` is to create a more extensible version of the original application while leveraging more recent frameworks such as React/Redux.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app). For available scripts and other related info, see [our docs](docs/REACTAPP.md)

## Contributing Guidelines

We welcome [issues](https://github.com/Microsoft/VoTT/issues) and [pull requests](https://github.com/Microsoft/VoTT/pulls) into the project. We ask that you follow these simple guidelines when 

### Pull Requests

- Branch `v2` is always stable (passes `tslint` and unit tests)
- 

### Issues
- Look for duplicate issues

## Download and Use

For those who just want to use VoTT rather than contributing to it, you have two options:

####1. Download and install release package for your environment (recommended)
   Find our [most recent release](https://github.com/Microsoft/VoTT/releases), download and run. `v2` releases will be prefixed by `2.x`.
   
####2. Clone repo and run from terminal using `npm`
   Run the following commands in your terminal:
   ```bash
    git clone https://github.com/Microsoft/VoTT
    cd VoTT
    git checkout v2
    npm install
    npm run    
   ```


   Important to note that when running with `npm`, both the electron and the browser versions of the applications will start. The only major difference is that electron can access the local file system.