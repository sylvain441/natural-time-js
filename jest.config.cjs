module.exports = {
  preset: 'ts-jest',
  // Sources import './x.js' for Node ESM; jest finds './x.ts'
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
};
