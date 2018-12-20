# Order of Operation

## Command

```bash
npm run release
```

### Underneath the hood

1. Create the `react` bundle inside the `build` directory, 
   * have to run this first because it will override everything in the `build` directory; 
   * create `index.html` & `static/`

    ```bash
    react-scripts build
    ```

1. Create `build/electron` directory and the entry point file `bundle.js`

    ```bash
    webpack -p --config ./config/webpack.dev.config.js
    ```

1. Now you can build the os-specific executable
    ```bash
    electron-builder
    ```

### Relevant files

1. `.env`
   * environment variables use by `react-script` to generate the correct content for `build/index.html`

1. `electron-builder.yml`
   * configuration for electron-builder

1. `package.json`
   * dependencies and scripts
