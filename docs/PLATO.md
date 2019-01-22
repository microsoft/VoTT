# Overview

We're using [plato](https://github.com/es-analysis/plato) to analyze code complexity.

You can view the report on the latest `v2` commit [here](https://microsoft.github.io/VoTT/)

## Local development

1. The following command will generate a `plato-report` directory.

    ```bash
    npm run plato
    ```

1. Open `plato-report/index.html` in your browser to see the report locally.

## Debugging

1. If npm script is not working for you, you can run this manually

    * Make sure you have `typescript` & `plato` installed locally

        ```bash
        npm install -g typescript
        npm install -g plato
        ```

    * Run following command

        ```bash
        tsc --noEmit false --outDir js-src && plato -r -d plato-report js-src
        ```
