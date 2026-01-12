/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { useQuickSwitcher } from "../quick-switcher";

// Test only the hook, not the full component (which has complex dialog dependencies)
describe("useQuickSwitcher", () => {
  function TestComponent() {
    const { isOpen, open, close, toggle } = useQuickSwitcher();

    return (
      <div>
        <span data-testid="state">{isOpen ? "open" : "closed"}</span>
        <button onClick={open}>Open</button>
        <button onClick={close}>Close</button>
        <button onClick={toggle}>Toggle</button>
      </div>
    );
  }

  it("should start closed", () => {
    render(<TestComponent />);

    expect(screen.getByTestId("state")).toHaveTextContent("closed");
  });

  it("should open when open is called", () => {
    render(<TestComponent />);

    fireEvent.click(screen.getByText("Open"));

    expect(screen.getByTestId("state")).toHaveTextContent("open");
  });

  it("should close when close is called", () => {
    render(<TestComponent />);

    fireEvent.click(screen.getByText("Open"));
    fireEvent.click(screen.getByText("Close"));

    expect(screen.getByTestId("state")).toHaveTextContent("closed");
  });

  it("should toggle when toggle is called", () => {
    render(<TestComponent />);

    fireEvent.click(screen.getByText("Toggle"));
    expect(screen.getByTestId("state")).toHaveTextContent("open");

    fireEvent.click(screen.getByText("Toggle"));
    expect(screen.getByTestId("state")).toHaveTextContent("closed");
  });

  it("should open on Ctrl+P keyboard shortcut", () => {
    render(<TestComponent />);

    fireEvent.keyDown(window, { key: "p", ctrlKey: true });

    expect(screen.getByTestId("state")).toHaveTextContent("open");
  });
});
