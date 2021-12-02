const webpack = require('webpack');
const config = require('./webpack.config.common');

config.plugins.push(new webpack.NoErrorsPlugin());
config.devtool = "#inline-cheap-module-eval-source-map";
config.devServer = {
    proxy: [
        {
            context: ["/openbach", "/kibana", "/grafana"],
            target: "http://172.20.34.41",
            toProxy: true,
        }
    ]
};
module.exports = config;
