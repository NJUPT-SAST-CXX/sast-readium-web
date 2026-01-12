import { render } from "@testing-library/react";
import { PDFTTSReader } from "../tts-reader";
import { usePDFStore } from "@/lib/pdf";
import { useTTS } from "@/hooks/use-tts";

// Mock useTTS hook
jest.mock("@/hooks/use-tts");

// Mock pdf-store
jest.mock("@/lib/pdf");

describe("PDFTTSReader", () => {
  const mockTTS = {
    speak: jest.fn(),
    cancel: jest.fn(),
  };

  const mockPDFStore = {
    isReading: false,
    setIsReading: jest.fn(),
    currentPage: 1,
    numPages: 10,
    nextPage: jest.fn(),
    speechRate: 1.0,
    speechVolume: 1.0,
  };

  const mockPageObj = {
    getTextContent: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useTTS as unknown as jest.Mock).mockReturnValue(mockTTS);
    (usePDFStore as unknown as jest.Mock).mockReturnValue(mockPDFStore);
  });

  it("renders without crashing", () => {
    const { container } = render(
      <PDFTTSReader currentPageObj={mockPageObj as any} />
    );
    // Component returns null, so just check it doesn't throw
    expect(container).toBeInTheDocument();
  });

  it("returns null", () => {
    const { container } = render(
      <PDFTTSReader currentPageObj={mockPageObj as any} />
    );
    // PDFTTSReader returns null
    expect(container.firstChild).toBeNull();
  });

  it("does not speak when isReading is false", () => {
    render(<PDFTTSReader currentPageObj={mockPageObj as any} />);

    expect(mockTTS.speak).not.toHaveBeenCalled();
  });

  it("cancels speech when reading stops", () => {
    (usePDFStore as unknown as jest.Mock).mockReturnValue({
      ...mockPDFStore,
      isReading: true,
    });

    const { rerender } = render(
      <PDFTTSReader currentPageObj={mockPageObj as any} />
    );

    // Switch to not reading
    (usePDFStore as unknown as jest.Mock).mockReturnValue({
      ...mockPDFStore,
      isReading: false,
    });

    rerender(<PDFTTSReader currentPageObj={mockPageObj as any} />);

    expect(mockTTS.cancel).toHaveBeenCalled();
  });

  it("speaks current page text when isReading is true", async () => {
    const textContent = {
      items: [{ str: "Hello" }, { str: "World" }],
    };

    (mockPageObj.getTextContent as jest.Mock).mockResolvedValue(textContent);
    (usePDFStore as unknown as jest.Mock).mockReturnValue({
      ...mockPDFStore,
      isReading: true,
    });

    render(<PDFTTSReader currentPageObj={mockPageObj as any} />);

    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockTTS.speak).toHaveBeenCalledWith(
      "Hello World",
      expect.objectContaining({
        rate: 1.0,
        volume: 1.0,
      })
    );
  });

  it("uses speechRate from store when speaking", async () => {
    const textContent = {
      items: [{ str: "Test text" }],
    };

    (mockPageObj.getTextContent as jest.Mock).mockResolvedValue(textContent);
    (usePDFStore as unknown as jest.Mock).mockReturnValue({
      ...mockPDFStore,
      isReading: true,
      speechRate: 1.5,
    });

    render(<PDFTTSReader currentPageObj={mockPageObj as any} />);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockTTS.speak).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        rate: 1.5,
      })
    );
  });

  it("uses speechVolume from store when speaking", async () => {
    const textContent = {
      items: [{ str: "Test text" }],
    };

    (mockPageObj.getTextContent as jest.Mock).mockResolvedValue(textContent);
    (usePDFStore as unknown as jest.Mock).mockReturnValue({
      ...mockPDFStore,
      isReading: true,
      speechVolume: 0.8,
    });

    render(<PDFTTSReader currentPageObj={mockPageObj as any} />);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockTTS.speak).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        volume: 0.8,
      })
    );
  });

  it("calls nextPage when speech ends and not on last page", async () => {
    const textContent = {
      items: [{ str: "Page text" }],
    };

    (mockPageObj.getTextContent as jest.Mock).mockResolvedValue(textContent);
    (usePDFStore as unknown as jest.Mock).mockReturnValue({
      ...mockPDFStore,
      isReading: true,
      currentPage: 1,
      numPages: 10,
    });

    render(<PDFTTSReader currentPageObj={mockPageObj as any} />);

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Get the onEnd callback
    const callArgs = mockTTS.speak.mock.calls[0];
    const options = callArgs[1];
    expect(options.onEnd).toBeDefined();

    // Call the onEnd callback
    options.onEnd();

    expect(mockPDFStore.nextPage).toHaveBeenCalled();
  });

  it("stops reading when on last page and speech ends", async () => {
    const textContent = {
      items: [{ str: "Last page" }],
    };

    (mockPageObj.getTextContent as jest.Mock).mockResolvedValue(textContent);
    (usePDFStore as unknown as jest.Mock).mockReturnValue({
      ...mockPDFStore,
      isReading: true,
      currentPage: 10,
      numPages: 10,
    });

    render(<PDFTTSReader currentPageObj={mockPageObj as any} />);

    await new Promise((resolve) => setTimeout(resolve, 100));

    const callArgs = mockTTS.speak.mock.calls[0];
    const options = callArgs[1];
    options.onEnd();

    expect(mockPDFStore.setIsReading).toHaveBeenCalledWith(false);
  });

  it("stops reading on speech error", async () => {
    const textContent = {
      items: [{ str: "Error text" }],
    };

    (mockPageObj.getTextContent as jest.Mock).mockResolvedValue(textContent);
    (usePDFStore as unknown as jest.Mock).mockReturnValue({
      ...mockPDFStore,
      isReading: true,
    });

    render(<PDFTTSReader currentPageObj={mockPageObj as any} />);

    await new Promise((resolve) => setTimeout(resolve, 100));

    const callArgs = mockTTS.speak.mock.calls[0];
    const options = callArgs[1];
    expect(options.onError).toBeDefined();

    // Call the onError callback
    options.onError({} as SpeechSynthesisErrorEvent);

    expect(mockPDFStore.setIsReading).toHaveBeenCalledWith(false);
  });

  it("skips empty pages and moves to next page", async () => {
    const emptyTextContent = {
      items: [],
    };

    (mockPageObj.getTextContent as jest.Mock).mockResolvedValue(
      emptyTextContent
    );
    (usePDFStore as unknown as jest.Mock).mockReturnValue({
      ...mockPDFStore,
      isReading: true,
      currentPage: 5,
      numPages: 10,
    });

    render(<PDFTTSReader currentPageObj={mockPageObj as any} />);

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should skip empty page and move to next
    expect(mockPDFStore.nextPage).toHaveBeenCalled();
    expect(mockTTS.speak).not.toHaveBeenCalled();
  });

  it("stops reading when reaching last empty page", async () => {
    const emptyTextContent = {
      items: [],
    };

    (mockPageObj.getTextContent as jest.Mock).mockResolvedValue(
      emptyTextContent
    );
    (usePDFStore as unknown as jest.Mock).mockReturnValue({
      ...mockPDFStore,
      isReading: true,
      currentPage: 10,
      numPages: 10,
    });

    render(<PDFTTSReader currentPageObj={mockPageObj as any} />);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockPDFStore.setIsReading).toHaveBeenCalledWith(false);
  });

  it("does not read same page twice", async () => {
    const textContent = {
      items: [{ str: "Page text" }],
    };

    (mockPageObj.getTextContent as jest.Mock).mockResolvedValue(textContent);
    (usePDFStore as unknown as jest.Mock).mockReturnValue({
      ...mockPDFStore,
      isReading: true,
      currentPage: 1,
    });

    const { rerender } = render(
      <PDFTTSReader currentPageObj={mockPageObj as any} />
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    // First call should be made
    expect(mockTTS.speak).toHaveBeenCalledTimes(1);

    // Rerender with same page - should not speak again
    rerender(<PDFTTSReader currentPageObj={mockPageObj as any} />);

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Still only 1 call
    expect(mockTTS.speak).toHaveBeenCalledTimes(1);
  });

  it("handles null currentPageObj", () => {
    (usePDFStore as unknown as jest.Mock).mockReturnValue({
      ...mockPDFStore,
      isReading: true,
    });

    const { container } = render(<PDFTTSReader currentPageObj={null} />);

    expect(mockTTS.speak).not.toHaveBeenCalled();
    expect(container).toBeInTheDocument();
  });

  it("cleans up TTS on unmount", () => {
    (usePDFStore as unknown as jest.Mock).mockReturnValue({
      ...mockPDFStore,
      isReading: true,
    });

    const { unmount } = render(
      <PDFTTSReader currentPageObj={mockPageObj as any} />
    );

    unmount();

    // Cleanup effect should call cancel
    expect(mockTTS.cancel).toHaveBeenCalled();
  });

  it("handles text extraction error gracefully", async () => {
    (mockPageObj.getTextContent as jest.Mock).mockRejectedValue(
      new Error("Text extraction failed")
    );
    (usePDFStore as unknown as jest.Mock).mockReturnValue({
      ...mockPDFStore,
      isReading: true,
    });

    // Should not throw
    render(<PDFTTSReader currentPageObj={mockPageObj as any} />);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockPDFStore.setIsReading).toHaveBeenCalledWith(false);
  });

  it("handles items without str property", async () => {
    const textContent = {
      items: [
        { str: "Valid" },
        { otherProp: "Invalid" }, // Missing str property
        { str: "Valid2" },
      ],
    };

    (mockPageObj.getTextContent as jest.Mock).mockResolvedValue(textContent);
    (usePDFStore as unknown as jest.Mock).mockReturnValue({
      ...mockPDFStore,
      isReading: true,
    });

    render(<PDFTTSReader currentPageObj={mockPageObj as any} />);

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should extract text even with missing properties
    expect(mockTTS.speak).toHaveBeenCalledWith(
      expect.stringContaining("Valid"),
      expect.any(Object)
    );
  });
});
