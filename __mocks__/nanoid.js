// Mock nanoid for Jest
let counter = 0;

module.exports = {
  nanoid: () => `mock-id-${++counter}`,
  customAlphabet: () => () => `mock-custom-id-${++counter}`,
};
