module.exports = {
    extends: ['next/core-web-vitals', 'turbo', 'prettier'],
    ignorePatterns: ['node_modules', 'dist'],
    parserOptions: {
      babelOptions: {
        presets: [require.resolve('next/babel')],
      },
    },
  };