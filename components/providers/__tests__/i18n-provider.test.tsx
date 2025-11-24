import { render, screen, fireEvent } from "@testing-library/react";
import { I18nProvider } from "../i18n-provider";
import { I18nextProvider } from "react-i18next";

// Mock i18next
jest.mock("@/lib/i18n", () => ({
  language: "en",
  changeLanguage: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  services: {
    resourceStore: {
      data: {},
    },
  },
}));

describe("I18nProvider", () => {
  it("renders children wrapped in provider", () => {
    render(
      <I18nProvider>
        <div data-testid="child">Child</div>
      </I18nProvider>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});
