const nodeExternals = require('webpack-node-externals');
const path = require('path');

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
        extensions: ['.tsx', '.ts', '.js']
    },
    externals: [nodeExternals()]
};
