'use strict'

var webpack = require('webpack');
var path = require('path');

var shouldWatch = (process.argv.indexOf('--watch') !== -1);

var config = {
  entry: './main.js',
  output: {
    path: __dirname,
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader'
      },
      {
        test: /\.html$/,
        loader: 'html-loader'
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      },
      {
        test: /\.js$/,
        exclude: [
          /node_modules/
        ],
        loaders: [
          'babel-loader'
        ]
      }
    ]
  },
  watch: shouldWatch
};



module.exports = config;
