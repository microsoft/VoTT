const path = require("path");

module.exports = {
  target: "electron-main",
  entry: "./src/electron/main.ts",
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