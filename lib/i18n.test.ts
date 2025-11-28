// Test the i18n module exports and structure
// We can't easily test the actual initialization since it requires proper mocking
// of all i18next plugins, so we test the module interface

describe("i18n configuration", () => {
  it("should export i18n instance", async () => {
    // Dynamic import to avoid initialization issues
    const i18nModule = await import("./i18n");
    const i18n = i18nModule.default;

    expect(i18n).toBeDefined();
    // i18n should have standard properties
    expect(typeof i18n.t).toBe("function");
    expect(typeof i18n.use).toBe("function");
    expect(typeof i18n.init).toBe("function");
  });
});
