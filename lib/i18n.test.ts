import i18n from "./i18n";

jest.mock("i18next", () => {
  const originalModule = jest.requireActual("i18next");
  return {
    ...originalModule,
    use: jest.fn().mockReturnThis(),
    init: jest.fn(),
  };
});

jest.mock("react-i18next", () => ({
  initReactI18next: {
    type: "3rdParty",
    init: jest.fn(),
  },
}));

jest.mock("i18next-browser-languagedetector", () => ({}));
jest.mock("i18next-resources-to-backend", () => jest.fn());

describe("i18n configuration", () => {
  it("should be initialized", () => {
    expect(i18n).toBeDefined();
    // Since we mocked the chain, we can check if use was called
    expect(i18n.use).toHaveBeenCalled();
  });
});
