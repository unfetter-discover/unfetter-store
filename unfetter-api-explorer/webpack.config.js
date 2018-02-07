const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './src/js/app.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        publicPath: '/dist'
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
        ])
    ],
    devServer: {
        port: 3201,
        publicPath: "/",
        stats: {
            colors: true
        },
        proxy: {
            "/api": {
                "target": "https://localhost",
                "secure": false,
                "logLevel": "debug",
                "ignorePath": false,
                "changeOrigin": true
            }
        }
    }
};
