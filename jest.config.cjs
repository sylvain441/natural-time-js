module.exports = {
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testEnvironment: 'node',
  verbose: true,
  collectCoverageFrom: [
    'index.js',
    'context.js',
    'utils/**/*.js',
    '!**/*.test.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(astronomy-engine)/)'
  ]
}; 