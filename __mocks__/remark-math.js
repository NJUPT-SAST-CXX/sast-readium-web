/**
 * Mock for remark-math ESM module
 */
module.exports = function remarkMath() {
  return function transformer(tree) {
    return tree;
  };
};
