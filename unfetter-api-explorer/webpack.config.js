const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/js/app.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        publicPath: '/'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['es2015']
                        }
                    }
                ]
            },
            {
                test: /\.scss$/,
                use: ['style-loader', 'css-loader', 'sass-loader']
            }
        ]
    },
    plugins: [
        new CopyWebpackPlugin([
            { 
                from: 'src/assets', 
                to: 'assets' 
            },
            {
                from: 'src/explorer',
                to: 'explorer'
            }
        ]),
        new HtmlWebpackPlugin({
            path: '/',
            hash: true,
            template: './src/index.html'
        })
    ],
    devServer: {
        port: 3200,
        publicPath: '/',
        stats: {
            colors: true
        },
        proxy: {
            '/api': {
                'target': 'https://localhost',
                'secure': false,
                'logLevel': 'debug',
                'ignorePath': false,
                'changeOrigin': true
            }
        }
    }
};
