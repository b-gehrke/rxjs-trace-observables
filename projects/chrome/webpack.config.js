module.exports = {
    entry: {
        background: './src/scripts/background.ts',
        contentScript: './src/scripts/contentScript.ts',
        devtoolsBackground: './src/scripts/devtoolsBackground.ts',
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
};
