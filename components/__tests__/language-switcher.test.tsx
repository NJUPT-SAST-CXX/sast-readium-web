import { render, screen, fireEvent } from "@testing-library/react";
import { LanguageSwitcher } from "../language-switcher";

const mockChangeLanguage = jest.fn();
const mockDetect = jest.fn();

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultVal: string) => defaultVal || key,
    i18n: {
      language: "en",
      changeLanguage: mockChangeLanguage,
      services: {
        languageDetector: {
          detect: mockDetect,
        },
      },
    },
  }),
}));

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("renders language switcher button", () => {
    render(<LanguageSwitcher />);
    expect(screen.getByTitle("Language")).toBeInTheDocument();
  });

  it("opens popover and shows options", () => {
    render(<LanguageSwitcher />);
    const button = screen.getByTitle("Language");
    fireEvent.click(button);

    expect(screen.getByText("中文")).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Auto")).toBeInTheDocument();
  });

  it("switches to specific language", () => {
    render(<LanguageSwitcher />);
    const button = screen.getByTitle("Language");
    fireEvent.click(button);

    fireEvent.click(screen.getByText("中文"));
    expect(mockChangeLanguage).toHaveBeenCalledWith("zh");
  });

  it("switches to auto", () => {
    mockDetect.mockReturnValue("zh");
    render(<LanguageSwitcher />);
    const button = screen.getByTitle("Language");
    fireEvent.click(button);

    fireEvent.click(screen.getByText("Auto"));
    expect(localStorage.getItem("i18nextLng")).toBeNull();
    expect(mockChangeLanguage).toHaveBeenCalledWith("zh");
  });
});
