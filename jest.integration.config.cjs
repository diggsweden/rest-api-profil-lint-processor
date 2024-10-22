/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = async () => {
  return {
    preset: 'ts-jest/presets/default-esm',
    testPathIgnorePatterns: ['util'],
    testEnvironment: 'node',
    "extensionsToTreatAsEsm": [".ts"],
    globals: {
      'ts-jest': {
        useESM: true,
      },
    },
    testMatch: ['**/tests/integration/**/*.test.ts']
  };
};