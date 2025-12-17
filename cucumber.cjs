const domain = process.env.DOMAIN || 'social';

module.exports = {
  default: {
    paths: [
      'common/features/**/*.feature',
      `domains/${domain}/features/**/*.feature`,
    ],
    import: [
      'common/features/support/**/*.js',
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
  },
};
