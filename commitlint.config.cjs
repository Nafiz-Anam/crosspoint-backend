module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-empty": [2, "never"],
    "subject-empty": [2, "never"],
    "type-empty": [2, "never"],
  },
};
