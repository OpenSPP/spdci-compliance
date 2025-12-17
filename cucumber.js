const domain = process.env.DOMAIN || 'social';

export default {
  default: {
    paths: [
      'common/features/**/*.feature',
      `domains/${domain}/features/**/*.feature`,
    ],
    require: [
      'common/features/support/**/*.js',
      `domains/${domain}/features/support/**/*.js`,
    ],
    format: [
      'summary',
      'progress-bar',
      ['html', 'results/report.html'],
    ],
    formatOptions: {
      snippetInterface: 'async-await',
    },
    publishQuiet: true,
  },
};
