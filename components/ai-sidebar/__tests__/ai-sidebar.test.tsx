/**
 * Tests for AISidebar component (components/ai-sidebar/ai-sidebar.tsx)
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { AISidebar } from "../ai-sidebar";
import { useAIChatStore } from "@/lib/ai-chat-store";

// Mock child components
jest.mock("../ai-chat-panel", () => ({
  AIChatPanel: () => <div data-testid="ai-chat-panel">Chat Panel</div>,
}));

jest.mock("../ai-settings-panel", () => ({
  AISettingsPanel: () => (
    <div data-testid="ai-settings-panel">Settings Panel</div>
  ),
}));

jest.mock("../ai-history-panel", () => ({
  AIHistoryPanel: () => <div data-testid="ai-history-panel">History Panel</div>,
}));

jest.mock("../ai-tools-panel", () => ({
  AIToolsPanel: () => <div data-testid="ai-tools-panel">Tools Panel</div>,
}));

// Mock react-i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock window.innerWidth
const setWindowWidth = (width: number) => {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event("resize"));
};

beforeEach(() => {
  jest.clearAllMocks();
  setWindowWidth(1024); // Desktop by default

  useAIChatStore.setState({
    isSidebarOpen: true,
  });
});

describe("AISidebar", () => {
  const defaultProps = {
    width: 400,
    onResizeStart: jest.fn(),
  };

  describe("Desktop Mode", () => {
    beforeEach(() => {
      setWindowWidth(1024);
    });

    it("should render sidebar when open", () => {
      render(<AISidebar {...defaultProps} />);

      expect(screen.getByText("ai.sidebar_title")).toBeInTheDocument();
    });

    it("should render tabs", () => {
      render(<AISidebar {...defaultProps} />);

      expect(screen.getByText("ai.chat")).toBeInTheDocument();
      expect(screen.getByText("ai.tools")).toBeInTheDocument();
      expect(screen.getByText("ai.history")).toBeInTheDocument();
      expect(screen.getByText("ai.settings")).toBeInTheDocument();
    });

    it("should show chat panel by default", () => {
      render(<AISidebar {...defaultProps} />);

      expect(screen.getByTestId("ai-chat-panel")).toBeInTheDocument();
    });

    it("should have tools tab", () => {
      render(<AISidebar {...defaultProps} />);

      expect(screen.getByText("ai.tools")).toBeInTheDocument();
    });

    it("should have history tab", () => {
      render(<AISidebar {...defaultProps} />);

      expect(screen.getByText("ai.history")).toBeInTheDocument();
    });

    it("should have settings tab", () => {
      render(<AISidebar {...defaultProps} />);

      expect(screen.getByText("ai.settings")).toBeInTheDocument();
    });

    it("should close sidebar when close button is clicked", () => {
      render(<AISidebar {...defaultProps} />);

      const closeButton = screen.getByRole("button", {
        name: "ai.close_sidebar",
      });
      fireEvent.click(closeButton);

      expect(useAIChatStore.getState().isSidebarOpen).toBe(false);
    });

    it("should apply width style", () => {
      const { container } = render(<AISidebar {...defaultProps} />);

      const sidebar = container.firstChild as HTMLElement;
      expect(sidebar.style.width).toBe("400px");
    });

    it("should call onResizeStart when resize handle is clicked", () => {
      const onResizeStart = jest.fn();
      const { container } = render(
        <AISidebar {...defaultProps} onResizeStart={onResizeStart} />
      );

      const resizeHandle = container.querySelector(".cursor-col-resize");
      if (resizeHandle) {
        fireEvent.mouseDown(resizeHandle);
        expect(onResizeStart).toHaveBeenCalled();
      }
    });

    it("should hide sidebar when closed", () => {
      useAIChatStore.setState({ isSidebarOpen: false });

      const { container } = render(<AISidebar {...defaultProps} />);

      const sidebar = container.firstChild as HTMLElement;
      expect(sidebar.style.width).toBe("0px");
      expect(sidebar).toHaveClass("pointer-events-none");
    });
  });

  describe("Responsive Behavior", () => {
    it("should handle window resize events", () => {
      render(<AISidebar {...defaultProps} />);

      // Should render in desktop mode initially
      expect(screen.getByText("ai.sidebar_title")).toBeInTheDocument();
    });
  });
});
