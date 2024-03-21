module.exports = {
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  testEnvironment: "node",
  testRegex: "./src/.*\\.(test|spec)?\\.(js|ts)$",
  moduleFileExtensions: ["ts", "js", "json", "node"],
  roots: ["<rootDir>/src"],
};
