const merge = require('webpack-merge')
const common = require('./webpack.common.js')

module.exports = merge(common, {
  mode: 'development',
  devtool: "inline-source-map",
  node: {
    __dirname: false,
    __filename: false
  }
})