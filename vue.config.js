const path = require('path');

module.exports = {
  configureWebpack: config => {
    const dynamicVarRule = {
      test: /\.dcss$/,
      use: [
        {
          loader: path.resolve('src/loaders/dynamic-vars.js'),
        },
        { loader: 'sass-loader' },
      ],
    };
    config.module.rules.push(dynamicVarRule)
  }
}
