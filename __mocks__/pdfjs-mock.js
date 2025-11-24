module.exports = {
  GlobalWorkerOptions: {
    workerSrc: "",
  },
  getDocument: jest.fn(() => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: jest.fn(() => Promise.resolve({
        getViewport: () => ({ width: 100, height: 100 }),
        render: () => ({ promise: Promise.resolve(), cancel: () => {} }),
        getTextContent: () => Promise.resolve({ items: [] }),
        getAnnotations: () => Promise.resolve([]),
      })),
      destroy: jest.fn(),
    }),
  })),
};
