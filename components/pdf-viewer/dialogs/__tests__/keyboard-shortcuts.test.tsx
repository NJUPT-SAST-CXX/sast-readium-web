import { render, screen } from "@testing-library/react";
import { KeyboardShortcutsDialog } from "../keyboard-shortcuts";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("KeyboardShortcutsDialog", () => {
  it("renders content when open", () => {
    render(<KeyboardShortcutsDialog open={true} onOpenChange={jest.fn()} />);
    expect(screen.getByText("shortcuts.title")).toBeInTheDocument();
    expect(screen.getByText("shortcuts.group.navigation")).toBeInTheDocument();
  });

  it("renders keys", () => {
    render(<KeyboardShortcutsDialog open={true} onOpenChange={jest.fn()} />);
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("End")).toBeInTheDocument();
  });
});
