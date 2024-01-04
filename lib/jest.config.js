/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {

  preset: 'ts-jest',
  testEnvironment: 'node',
  isolatedModules: true,
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        diagnostics: false,
      },
    ],
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};
