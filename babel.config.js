module.exports = {
  presets: ['module:@react-native/babel-preset'],
  env: {
    // Strip console.* (except warn/error) from release bundles only — dev keeps logs.
    production: {
      plugins: [['transform-remove-console', { exclude: ['error', 'warn'] }]],
    },
  },
};
