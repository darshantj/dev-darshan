export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Warn (1) when the scope isn't one of ours; the second value 'always' means "always check".
    'scope-enum': [
      1,
      'always',
      ['api', 'gateway', 'worker', 'web', 'contracts', 'platform', 'db', 'infra', 'ci', 'deps'],
    ],
  },
};
