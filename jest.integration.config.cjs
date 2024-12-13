/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = async () => {
  return {
    preset: 'ts-jest/presets/default-esm',
    testPathIgnorePatterns: ['util'],
    testEnvironment: 'node',
    "extensionsToTreatAsEsm": [".ts"],
    transform: {
      '^.+\\.ts$': ['ts-jest', { useESM: true }], // ts-jest config moved here
    },
    testMatch: ['**/tests/integration/**/*.test.ts']
  };
};