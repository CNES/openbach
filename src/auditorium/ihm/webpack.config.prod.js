const webpack = require('webpack');
const config = require('./webpack.config.common');

config.plugins = config.plugins.concat([
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin({
        beautify: false,
        comments: false,
        compress: {
            warnings: false
        },
        mangle: {
            screw_ie8: true
        }
    }),
    new webpack.optimize.AggressiveMergingPlugin(),
    new webpack.DefinePlugin({
        'process.env': {
            'NODE_ENV': '"production"'
        }
    })
]);

module.exports = config;
