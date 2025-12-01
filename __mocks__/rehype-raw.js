// Mock for rehype-raw ESM module
module.exports = {
  __esModule: true,
  default: function rehypeRaw() {
    return function transformer() {};
  },
};
