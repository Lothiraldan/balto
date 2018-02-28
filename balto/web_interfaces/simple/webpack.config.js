"use strict";

const webpack = require("webpack");
const path = require("path");
const merge = require("webpack-merge");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");

const port = 8123;
const host = "localhost";
const title = "Balto web interface";
const author = "Lothiraldan";
const target = process.env.npm_lifecycle_event;
const entryPath = path.join(__dirname, "src/index.js");
const outputPath = path.join(__dirname, "");
const outputFilename = target === "dist" ? "[name]-[hash].js" : "[name].js";
const elmSource = path.join(__dirname, "src");

const htmlPlugin = new HtmlWebpackPlugin({
  template: "src/index.html.templ",
  inject: "body",
  filename: "index.html",
  title: title,
  author: "Lothiraldan"
});

// Common configuration
const commonConfig = {
  output: {
    path: outputPath,
    filename: `static/js/${outputFilename}`
  },
  resolve: {
    extensions: [".js", ".elm"],
    modules: ["node_modules"]
  },
  module: {
    noParse: /\.elm$/,
    rules: [
      {
        test: /\.(eot|ttf|woff|woff2|svg)$/,
        use: "file-loader?publicPath=../../&name=static/css/[hash].[ext]"
      }
    ]
  }
};

// Development mode
const developmentConfig = {
  entry: [`webpack-dev-server/client?http://${host}:${port}`, entryPath],
  devServer: {
    // serve index.html in place of 404 responses
    historyApiFallback: true,
    contentBase: ["../src", "../node_modules", "./src", "./"],
    hot: true
  },
  module: {
    rules: [
      {
        test: /\.elm$/,
        exclude: [/elm-stuff/, /node_modules/],
        use: [
          {
            loader: "elm-webpack-loader",
            options: {
              verbose: true,
              warn: true,
              debug: true,
              cwd: elmSource
            }
          }
        ]
      },
      {
        test: /\.sc?ss$/,
        use: [
          { loader: "style-loader" },
          { loader: "css-loader" },
          {
            loader: "sass-loader",
            options: {
              includePaths: [path.resolve(__dirname, "node_modules")]
            }
          }
        ]
      }
    ]
  },
  plugins: [htmlPlugin]
};

// Production mode
const productionConfig = {
  entry: entryPath,
  module: {
    rules: [
      {
        test: /\.elm$/,
        exclude: [/elm-stuff/, /node_modules/],
        use: [
          {
            loader: "elm-webpack-loader",
            options: {
              cwd: elmSource
            }
          }
        ]
      },
      {
        test: /\.sc?ss$/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: ["css-loader", "sass-loader"]
        })
      }
    ]
  },
  plugins: [
    new ExtractTextPlugin({
      filename: "static/css/[name]-[hash].css",
      allChunks: true
    }),
    new CopyWebpackPlugin([
      // {
      //     from: 'assets/images/',
      //     to: 'static/images/'
      // },
      {
        from: "src/favicon.ico"
      }
    ]),

    htmlPlugin,

    new webpack.optimize.UglifyJsPlugin({
      minimize: true,
      compressor: {
        warnings: false
      }
      // mangle:  true
    })
  ]
};

if (target === "dev") {
  module.exports = merge(commonConfig, developmentConfig);
} else {
  module.exports = merge(commonConfig, productionConfig);
}
