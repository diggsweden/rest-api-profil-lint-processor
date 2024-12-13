/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = async () => {
  return {
    preset: 'ts-jest',
    testPathIgnorePatterns: ['util'],
    testEnvironment: 'node',
    "extensionsToTreatAsEsm": [".ts"],
    transform: {
      '.*': ['ts-jest', {useIsolatedModules: true }]
    }
  };
};