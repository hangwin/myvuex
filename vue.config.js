module.exports = {
    chainWebpack: config => {
        config.plugin('define').tap(args => {
            args.unshift({
                __DEV__: JSON.stringify(true)
            });
            return args;
        })
    }
}