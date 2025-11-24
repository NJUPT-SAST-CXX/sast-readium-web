import { render, screen, fireEvent } from "@testing-library/react";
import { PasswordDialog } from "../password-dialog";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("PasswordDialog", () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  it("renders when open", () => {
    render(
      <PasswordDialog
        open={true}
        fileName="secret.pdf"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByText("dialog.password.title")).toBeInTheDocument();
  });

  it("submits password", () => {
    render(
      <PasswordDialog
        open={true}
        fileName="secret.pdf"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const input = screen.getByPlaceholderText("dialog.password.placeholder");
    fireEvent.change(input, { target: { value: "password123" } });
    
    const submitBtn = screen.getByText("dialog.password.submit");
    fireEvent.click(submitBtn);

    expect(mockOnSubmit).toHaveBeenCalledWith("password123");
  });

  it("shows error message", () => {
    render(
      <PasswordDialog
        open={true}
        fileName="secret.pdf"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        error={true}
      />
    );
    expect(screen.getByText("dialog.password.incorrect")).toBeInTheDocument();
  });
});
