import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AboutContent } from "../about-content";
import { checkForAppUpdates } from "@/lib/platform";

// Mock next/image
/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => (
    <img {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />
  ),
}));
/* eslint-enable @next/next/no-img-element, jsx-a11y/alt-text */

// Mock translations
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === "about.update.available")
        return `Update available: ${options?.version}`;
      if (key === "about.update.error") return `Error: ${options?.error}`;
      if (key === "about.copyright") return `Copyright ${options?.year}`;
      return key;
    },
  }),
}));

// Mock update service
jest.mock("@/lib/platform", () => ({
  checkForAppUpdates: jest.fn(),
}));

// Mock AboutRuntimeInfo component
jest.mock("../about-runtime-info", () => ({
  AboutRuntimeInfo: () => <div data-testid="runtime-info">Runtime Info</div>,
}));

// Mock package.json - use correct relative path from __tests__ directory
jest.mock("../../../../package.json", () => ({
  version: "1.0.0",
  dependencies: {
    react: "18.0.0",
  },
}));

describe("AboutContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders project info correctly", () => {
    render(<AboutContent />);

    expect(screen.getByText("about.title")).toBeInTheDocument();
    expect(screen.getByText("about.description")).toBeInTheDocument();
    expect(screen.getByText("v1.0.0")).toBeInTheDocument(); // Version from mock
    expect(screen.getByText("MIT")).toBeInTheDocument();
    expect(screen.getByText("Runtime Info")).toBeInTheDocument();
  });

  it("renders dependencies", () => {
    render(<AboutContent />);
    expect(screen.getByText("react")).toBeInTheDocument();
    expect(screen.getByText("18.0.0")).toBeInTheDocument();
  });

  it("handles update check - available", async () => {
    (checkForAppUpdates as jest.Mock).mockResolvedValue({
      available: true,
      version: "2.0.0",
    });

    render(<AboutContent />);

    const checkButton = screen.getByText("about.check_update");
    fireEvent.click(checkButton);

    expect(screen.getByText("about.update.checking")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Update available: 2.0.0")).toBeInTheDocument();
    });
  });

  it("handles update check - latest", async () => {
    (checkForAppUpdates as jest.Mock).mockResolvedValue({
      available: false,
    });

    render(<AboutContent />);

    const checkButton = screen.getByText("about.check_update");
    fireEvent.click(checkButton);

    await waitFor(() => {
      expect(screen.getByText("about.update.latest")).toBeInTheDocument();
    });
  });

  it("handles update check - error", async () => {
    (checkForAppUpdates as jest.Mock).mockResolvedValue({
      available: false,
      error: "Network error",
    });

    render(<AboutContent />);

    const checkButton = screen.getByText("about.check_update");
    fireEvent.click(checkButton);

    await waitFor(() => {
      expect(screen.getByText("Error: Network error")).toBeInTheDocument();
    });
  });

  it("handles update check - exception", async () => {
    (checkForAppUpdates as jest.Mock).mockRejectedValue(new Error("Failed"));

    render(<AboutContent />);

    const checkButton = screen.getByText("about.check_update");
    fireEvent.click(checkButton);

    await waitFor(() => {
      expect(screen.getByText("Error: Error: Failed")).toBeInTheDocument();
    });
  });
});
