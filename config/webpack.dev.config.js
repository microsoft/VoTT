const path = require("path");

module.exports = {
  mode: "development",
  target: "electron-main",
  entry: "./src/electron/main.ts",
  devtool: "cheap-module-source-map",
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: [{
          loader: "ts-loader",
          options: {
            compilerOptions: {
              noEmit: false
            }
          }
        }],
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "../build")
  }
};