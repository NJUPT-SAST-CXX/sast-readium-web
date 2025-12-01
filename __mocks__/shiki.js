// Mock for shiki ESM module
module.exports = {
  __esModule: true,
  createHighlighter: jest.fn().mockResolvedValue({
    codeToHtml: jest.fn().mockReturnValue("<pre><code>mock code</code></pre>"),
    loadLanguage: jest.fn(),
    loadTheme: jest.fn(),
    getLoadedLanguages: jest.fn().mockReturnValue([]),
    getLoadedThemes: jest.fn().mockReturnValue([]),
  }),
};
