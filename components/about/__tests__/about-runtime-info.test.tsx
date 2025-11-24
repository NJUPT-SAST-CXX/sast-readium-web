import { render, screen, waitFor } from "@testing-library/react";
import { AboutRuntimeInfo } from "../about-runtime-info";
import { getAppRuntimeInfo, getSystemInfo } from "@/lib/tauri-bridge";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock("@/lib/tauri-bridge", () => ({
  getAppRuntimeInfo: jest.fn(),
  getSystemInfo: jest.fn(),
}));

describe("AboutRuntimeInfo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing while loading", () => {
    // Promise that never resolves to simulate loading
    (getSystemInfo as jest.Mock).mockReturnValue(new Promise(() => {}));
    (getAppRuntimeInfo as jest.Mock).mockReturnValue(new Promise(() => {}));

    const { container } = render(<AboutRuntimeInfo />);
    expect(container.firstChild).toBeNull();
  });

  it("renders browser mode when no system info", async () => {
    (getSystemInfo as jest.Mock).mockResolvedValue(null);
    (getAppRuntimeInfo as jest.Mock).mockResolvedValue(null);

    render(<AboutRuntimeInfo />);

    await waitFor(() => {
      expect(screen.getByText("about.runtime.browser")).toBeInTheDocument();
    });
  });

  it("renders desktop info when available", async () => {
    (getSystemInfo as jest.Mock).mockResolvedValue({
      os: "Windows",
      arch: "x86_64",
    });
    (getAppRuntimeInfo as jest.Mock).mockResolvedValue({
      name: "Test App",
      version: "1.0.0",
      tauri_version: "1.0.0",
      debug: true,
      exe_path: "/path/to/exe",
      current_dir: "/cwd",
    });

    render(<AboutRuntimeInfo />);

    await waitFor(() => {
      expect(screen.getByText("about.runtime.desktop")).toBeInTheDocument();
      expect(screen.getByText("Windows")).toBeInTheDocument();
      expect(screen.getByText("Test App")).toBeInTheDocument();
      expect(screen.getByText("debug")).toBeInTheDocument();
    });
  });
});
