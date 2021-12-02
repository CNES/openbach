const webpack = require("webpack");
const HtmlPlugin = require("html-webpack-plugin");
const {join} = require('path');
const cssnext = require('postcss-cssnext');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const fromActualDir = (dir) => join(__dirname, dir);

module.exports = {
    entry: {
        app: [fromActualDir('./src/app.tsx')]
    },
    output: {
        path: fromActualDir('../../../ansible/roles/install_auditorium/files/frontend'),
        filename: '[name]_[hash].js',
        publicPath: '/'
    },
    resolve: {
        extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js']
    },
    module: {
        preLoaders: [
            {
                test: /\.tsx?$/,
                loader: "tslint",
                exclude: /node_modules/
            }
        ],
        loaders: [
            /* TypeScript */
            {
                test: /\.tsx?$/,
                loader: 'ts'
            },
            /* Style */
            {
                test: /\.scss$/,
                loader: ExtractTextPlugin.extract('css?modules&importLoaders=1!postcss!sass')
                // Generate a separate CSS file
            },
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract("style-loader", "css-loader")
            },
            /* Images */
            {
                test: /\.(png|svg|jpg|gif)$/,
                loader: 'url?limit=10000&name=images/[name].[ext]' // inline under 10kB
                // Return a path or data url if under 10kB
            },
            {
                test: /\.ico$/,
                loader:'file-loader?name=[name].[ext]'
            },
            /* Fonts */
            {
                test: /\.woff$/,
                loader: 'url', // inline under 5kB
                query: {
                    name: 'font/[hash].[ext]',
                    limit: 5000 //kB
                }
            },
            {
                test: /\.(ttf|eot|woff2)$/,
                loader: 'file', // Just Copy file and return path
                query: {
                    name: 'font/[hash].[ext]'
                }
            }
        ]
    },
    postcss() {
        return [cssnext()];
        /*
         http://cssnext.io
         remove nearly all the interest in less/sass (particularly with css-loader)
         but Editors are still not ok with new css syntax...
         */
    },
    plugins: [
        new ExtractTextPlugin("style_[hash].css"),
        new HtmlPlugin({
            template: fromActualDir('./src/app.html')
            // Auto inject file paths
        }),
        new webpack.DefinePlugin({
            __DEV__: process.env.NODE_ENV !== 'production',
        })
    ]
};
