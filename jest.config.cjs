/** ESM Jest — run via `node --experimental-vm-modules` (see package.json test script). */
module.exports = {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/tests/**/*.test.js'],
  moduleFileExtensions: ['js', 'mjs', 'json'],
};
