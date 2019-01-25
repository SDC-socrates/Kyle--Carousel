var path = require("path");
var SRC_DIR = path.join(__dirname, "/client/src");
console.log(__dirname);
var DIST_DIR = path.join(__dirname, "/client/public");

module.exports = [{
  entry: `${SRC_DIR}/index.js`,
  output: {
    filename: "bundle.js",
    path: DIST_DIR
  },
  module: {
    loaders: [
      {
        test: /\.js?/,
        include: SRC_DIR,
        loader: "babel-loader",
        query: {
          presets: ["react", "es2015"]
        }
      }
    ]
  }
},
{
  entry: `${SRC_DIR}/index-ssr.js`,
  output: {
    filename: "bundle-ssr.js",
    path: DIST_DIR,
    libraryTarget: 'commonjs-module',
  },
  target: 'node',
  module: {
    loaders: [
      {
        test: /\.js?/,
        include: SRC_DIR,
        loader: "babel-loader",
        query: {
          presets: ["react", "es2015"]
        }
      }
    ]
  }
}];
