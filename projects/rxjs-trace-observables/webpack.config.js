const nodeExternals = require('webpack-node-externals');
const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: {
        traceObservablePipes: './src/index.ts',
    },
    devtool: "source-map",
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: "[name].js",
        libraryTarget: 'umd',
        library: 'TraceObservablePipes',
        umdNamedDefine: true

    },
    watchOptions: {
        aggregateTimeout: 300,
        ignored: ["node_modules", "dist"]
    },
    plugins: [
        new webpack.WatchIgnorePlugin([/.*\.(js|d\.ts)/]),
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.ts']
    },
    externals: [nodeExternals()]
};
