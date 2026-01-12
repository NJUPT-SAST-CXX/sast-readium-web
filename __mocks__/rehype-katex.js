/**
 * Mock for rehype-katex ESM module
 */
module.exports = function rehypeKatex() {
  return function transformer(tree) {
    return tree;
  };
};
