export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  setupFiles: ["<rootDir>/jest.setup.js"],
  
  // which test to run
  testMatch: [
    "<rootDir>/controllers/*.test.js",
    "<rootDir>/helpers/authHelper.test.js",
    "<rootDir>/middlewares/authMiddleware.test.js",
    "<rootDir>/models/*.test.js",
    "<rootDir>/config/db.test.js",
    "<rootDir>/tests/integration/*.test.js",
    "<rootDir>/tests/security/*.test.js",
  ],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "controllers/*.js",
    "helpers/authHelper.js",
    "middlewares/authMiddleware.js",
    "models/*.js",
    "config/db.js"
  ],
  coverageThreshold: {
    global: {
      lines: 99,
      functions: 99,
    },
  },
};
