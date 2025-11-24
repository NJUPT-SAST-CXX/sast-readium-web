import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PDFPropertiesDialog } from "../pdf-properties-dialog";
import { usePDFStore } from "@/lib/pdf-store";
import { updatePDFMetadata } from "@/lib/pdf-utils";

jest.mock("@/lib/pdf-store");
jest.mock("@/lib/pdf-utils");
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("PDFPropertiesDialog", () => {
  const mockStore = {
    metadata: {
      info: {
        Title: "Test Doc",
        Author: "Author Name",
      },
      contentLength: 1024,
    },
    numPages: 5,
    currentPDF: new File([], "test.pdf"),
    setCurrentPDF: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePDFStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  it("renders properties", () => {
    render(
      <PDFPropertiesDialog
        open={true}
        onOpenChange={jest.fn()}
      />
    );
    
    expect(screen.getAllByText("properties.title")[0]).toBeInTheDocument();
    expect(screen.getByText("Test Doc")).toBeInTheDocument();
    expect(screen.getByText("Author Name")).toBeInTheDocument();
  });

  it("switches to edit mode", () => {
    render(
      <PDFPropertiesDialog
        open={true}
        onOpenChange={jest.fn()}
      />
    );
    
    const editBtn = screen.getByText("menu.edit.label");
    fireEvent.click(editBtn);
    
    expect(screen.getByDisplayValue("Test Doc")).toBeInTheDocument();
    expect(screen.getByText("menu.file.save")).toBeInTheDocument();
  });

  it("saves metadata", async () => {
    (updatePDFMetadata as jest.Mock).mockResolvedValue(new File([], "updated.pdf"));

    render(
      <PDFPropertiesDialog
        open={true}
        onOpenChange={jest.fn()}
      />
    );
    
    fireEvent.click(screen.getByText("menu.edit.label"));
    
    const titleInput = screen.getByDisplayValue("Test Doc");
    fireEvent.change(titleInput, { target: { value: "New Title" } });
    
    fireEvent.click(screen.getByText("menu.file.save"));
    
    await waitFor(() => {
      expect(updatePDFMetadata).toHaveBeenCalledWith(
        mockStore.currentPDF,
        expect.objectContaining({ title: "New Title" })
      );
    });
  });
});
