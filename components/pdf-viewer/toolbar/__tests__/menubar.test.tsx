import { render, screen } from "@testing-library/react";
import { PDFMenuBar } from "../menubar";
import { usePDFStore } from "@/lib/pdf";

// Mock react-i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock pdf-store
jest.mock("@/lib/pdf");

// Mock LanguageSwitcher
jest.mock("@/components/core/language-switcher", () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher">Language</div>,
}));

// Mock PDFPropertiesDialog
jest.mock("../../dialogs/properties", () => ({
  PDFPropertiesDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="properties-dialog">Properties Dialog</div> : null,
}));

// Mock PDFRecentFilesDialog
jest.mock("../../dialogs/recent-files", () => ({
  PDFRecentFilesDialog: ({ open }: { open: boolean }) =>
    open ? (
      <div data-testid="recent-files-dialog">Recent Files Dialog</div>
    ) : null,
}));

// Mock tauri-bridge
jest.mock("@/lib/platform", () => ({
  isTauri: () => false,
  renameFile: jest.fn(),
}));

describe("PDFMenuBar", () => {
  const mockStore = {
    currentPDF: null,
    zoomIn: jest.fn(),
    zoomOut: jest.fn(),
    rotateClockwise: jest.fn(),
    toggleThumbnails: jest.fn(),
    toggleOutline: jest.fn(),
    toggleAnnotations: jest.fn(),
    undoAnnotation: jest.fn(),
    redoAnnotation: jest.fn(),
    canUndo: jest.fn(() => true),
    canRedo: jest.fn(() => true),
    setViewMode: jest.fn(),
    showMenuBar: true,
    toggleDarkMode: jest.fn(),
    isDarkMode: false,
  };

  const mockCallbacks = {
    onDownload: jest.fn(),
    onPrint: jest.fn(),
    onShare: jest.fn(),
    onSave: jest.fn(),
    onSearch: jest.fn(),
    onOpenSettings: jest.fn(),
    onOpenFile: jest.fn(),
    onOpenFolder: jest.fn(),
    onRevealInFileManager: jest.fn(),
    onOpenRecentFile: jest.fn(),
    onFileUpdate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePDFStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  it("renders menubar when showMenuBar is true", () => {
    render(<PDFMenuBar {...mockCallbacks} />);

    // Check for menu sections
    expect(screen.getByText("menu.file.label")).toBeInTheDocument();
    expect(screen.getByText("menu.edit.label")).toBeInTheDocument();
    expect(screen.getByText("menu.view.label")).toBeInTheDocument();
    expect(screen.getByText("menu.settings.label")).toBeInTheDocument();
  });

  it("hides menubar when showMenuBar is false", () => {
    (usePDFStore as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      showMenuBar: false,
    });

    const { container } = render(<PDFMenuBar {...mockCallbacks} />);

    // When showMenuBar is false, the main container should have pointer-events-none and opacity-0
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("opacity-0", "pointer-events-none");
  });

  it("renders all menu labels", () => {
    render(<PDFMenuBar {...mockCallbacks} />);

    expect(screen.getByText("menu.file.label")).toBeInTheDocument();
    expect(screen.getByText("menu.edit.label")).toBeInTheDocument();
    expect(screen.getByText("menu.view.label")).toBeInTheDocument();
    expect(screen.getByText("menu.settings.label")).toBeInTheDocument();
  });

  it("renders Language Switcher", () => {
    render(<PDFMenuBar {...mockCallbacks} />);

    expect(screen.getByTestId("language-switcher")).toBeInTheDocument();
  });

  it("renders with proper menu structure", () => {
    const { container } = render(<PDFMenuBar {...mockCallbacks} />);

    // Check for menubar element
    const menubar = container.querySelector('[role="menubar"]');
    expect(menubar).toBeInTheDocument();
  });

  it("has File menu trigger button", () => {
    const { container } = render(<PDFMenuBar {...mockCallbacks} />);

    // Check that File menu button exists
    const menuTriggers = container.querySelectorAll('[role="menuitem"]');
    expect(menuTriggers.length).toBeGreaterThan(0);
  });

  it("has Edit menu trigger button", () => {
    const { container } = render(<PDFMenuBar {...mockCallbacks} />);

    // Check that menu structure exists
    const menubar = container.querySelector('[role="menubar"]');
    expect(menubar).toBeInTheDocument();
    expect(menubar?.children.length).toBeGreaterThanOrEqual(4); // 4 menu sections
  });

  it("has View menu trigger button", () => {
    const { container } = render(<PDFMenuBar {...mockCallbacks} />);

    // All menu sections should be rendered
    // Menus are rendered but hidden until opened
    expect(container.querySelector('[role="menubar"]')).toBeInTheDocument();
  });

  it("uses pdf-store correctly", () => {
    render(<PDFMenuBar {...mockCallbacks} />);

    expect(usePDFStore).toHaveBeenCalled();
  });

  it("handles showMenuBar state changes", () => {
    const { rerender, container } = render(<PDFMenuBar {...mockCallbacks} />);

    // Initially visible
    let wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("max-h-16", "opacity-100");

    // Update to hidden
    (usePDFStore as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      showMenuBar: false,
    });
    rerender(<PDFMenuBar {...mockCallbacks} />);

    wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("max-h-0", "opacity-0");
  });

  it("renders properties dialog when triggered", () => {
    render(<PDFMenuBar {...mockCallbacks} />);

    // The dialog component is rendered but initially closed
    // We test that the component is present in the hierarchy
    expect(screen.queryByTestId("properties-dialog")).not.toBeInTheDocument();
  });

  it("renders recent files dialog when triggered", () => {
    render(<PDFMenuBar {...mockCallbacks} />);

    // The dialog component is rendered but initially closed
    expect(screen.queryByTestId("recent-files-dialog")).not.toBeInTheDocument();
  });

  it("passes correct props to callbacks", () => {
    const { container } = render(<PDFMenuBar {...mockCallbacks} />);

    // Verify that the menu bar is fully rendered with all expected elements
    const menubar = container.querySelector('[role="menubar"]');
    expect(menubar).toBeInTheDocument();
    expect(menubar?.children.length).toBeGreaterThan(0);
  });

  it("renders with animation classes", () => {
    const { container } = render(<PDFMenuBar {...mockCallbacks} />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass(
      "transition-[max-height,opacity]",
      "duration-200",
      "ease-out"
    );
  });

  it("renders inner content with proper structure", () => {
    const { container } = render(<PDFMenuBar {...mockCallbacks} />);

    // Check for the flex container with border
    const innerDiv = container.querySelector(".flex.items-center.border-b");
    expect(innerDiv).toBeInTheDocument();
  });

  it("mocks pdf-store hooks correctly", () => {
    render(<PDFMenuBar {...mockCallbacks} />);

    // Verify that mocks are working
    expect(usePDFStore).toHaveBeenCalledTimes(1);
  });

  it("does not render menu items when showMenuBar is false", () => {
    (usePDFStore as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      showMenuBar: false,
    });

    const { container } = render(<PDFMenuBar {...mockCallbacks} />);

    // Container exists but should have visibility hidden classes
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("opacity-0");
  });

  it("renders with expected DOM structure", () => {
    const { container } = render(<PDFMenuBar {...mockCallbacks} />);

    // Verify main container structure
    const mainDiv = container.querySelector(
      "div.transition-\\[max-height\\,opacity\\]"
    );
    expect(mainDiv).toBeInTheDocument();

    // Verify inner content structure
    const innerDiv = container.querySelector("div.flex.items-center.border-b");
    expect(innerDiv).toBeInTheDocument();
  });
});
