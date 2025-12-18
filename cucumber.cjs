const domain = process.env.DOMAIN || 'social';

const stepTimeout = parseInt(process.env.CUCUMBER_STEP_TIMEOUT_MS || '30000', 10);

module.exports = {
  default: {
    paths: [
      'common/features/**/*.feature',
      `domains/${domain}/features/**/*.feature`,
    ],
    import: [
      // Import common support (world, hooks, etc.) but NOT common/features/support/steps/
      // which are utility modules for domain step definitions to import as needed
      'common/features/support/*.js',
      'common/features/support/helpers/**/*.js',
      `domains/${domain}/features/support/**/*.js`,
    ],
    format: [
      'summary',
      'progress',
      ['html', 'results/report.html'],
    ],
    formatOptions: {
      snippetInterface: 'async-await',
    },
    // Increase step timeout for async callback workflows
    timeout: stepTimeout,
  },
};
