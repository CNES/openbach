const webpack = require('webpack');
const config = require('./webpack.config.common');

config.plugins.push(new webpack.NoErrorsPlugin());
config.devtool = "#inline-cheap-module-eval-source-map";
config.devServer = {
    proxy: [
        {
            context: ["/openbach", "/kibana", "/chronograf"],
            target: "http://172.20.34.75",
            toProxy: true,
        }
    ]
};
module.exports = config;
