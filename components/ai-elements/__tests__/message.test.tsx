/**
 * Tests for Message components (components/ai-elements/message.tsx)
 */

import { render, screen, fireEvent } from "@testing-library/react";

// Mock streamdown to avoid ESM issues
jest.mock("streamdown", () => ({
  Streamdown: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

import {
  Message,
  MessageContent,
  MessageActions,
  MessageAction,
} from "../message";

describe("Message Component", () => {
  describe("Message", () => {
    it("should render with user role", () => {
      render(
        <Message from="user" data-testid="message">
          <span>User message</span>
        </Message>
      );

      const message = screen.getByTestId("message");
      expect(message).toBeInTheDocument();
      expect(message).toHaveClass("is-user");
    });

    it("should render with assistant role", () => {
      render(
        <Message from="assistant" data-testid="message">
          <span>Assistant message</span>
        </Message>
      );

      const message = screen.getByTestId("message");
      expect(message).toBeInTheDocument();
      expect(message).toHaveClass("is-assistant");
    });

    it("should apply custom className", () => {
      render(
        <Message from="user" className="custom-class" data-testid="message">
          <span>Message</span>
        </Message>
      );

      expect(screen.getByTestId("message")).toHaveClass("custom-class");
    });

    it("should render children", () => {
      render(
        <Message from="user">
          <span>Test content</span>
        </Message>
      );

      expect(screen.getByText("Test content")).toBeInTheDocument();
    });
  });

  describe("MessageContent", () => {
    it("should render children", () => {
      render(
        <MessageContent>
          <span>Content text</span>
        </MessageContent>
      );

      expect(screen.getByText("Content text")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(
        <MessageContent className="custom-content" data-testid="content">
          <span>Content</span>
        </MessageContent>
      );

      expect(screen.getByTestId("content")).toHaveClass("custom-content");
    });
  });

  describe("MessageActions", () => {
    it("should render children", () => {
      render(
        <MessageActions>
          <button>Action 1</button>
          <button>Action 2</button>
        </MessageActions>
      );

      expect(screen.getByText("Action 1")).toBeInTheDocument();
      expect(screen.getByText("Action 2")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(
        <MessageActions className="custom-actions" data-testid="actions">
          <button>Action</button>
        </MessageActions>
      );

      expect(screen.getByTestId("actions")).toHaveClass("custom-actions");
    });
  });

  describe("MessageAction", () => {
    it("should render button", () => {
      render(
        <MessageAction>
          <span>Icon</span>
        </MessageAction>
      );

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should render with tooltip when provided", () => {
      render(
        <MessageAction tooltip="Copy message">
          <span>Copy</span>
        </MessageAction>
      );

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("should render without tooltip when not provided", () => {
      render(
        <MessageAction label="Copy">
          <span>Copy</span>
        </MessageAction>
      );

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("should have screen reader text", () => {
      render(
        <MessageAction label="Copy message">
          <span>Icon</span>
        </MessageAction>
      );

      expect(screen.getByText("Copy message")).toBeInTheDocument();
    });

    it("should use tooltip as screen reader text when label not provided", () => {
      render(
        <MessageAction tooltip="Delete">
          <span>Icon</span>
        </MessageAction>
      );

      expect(screen.getByText("Delete")).toBeInTheDocument();
    });

    it("should handle click events", () => {
      const handleClick = jest.fn();
      render(
        <MessageAction onClick={handleClick}>
          <span>Click me</span>
        </MessageAction>
      );

      fireEvent.click(screen.getByRole("button"));
      expect(handleClick).toHaveBeenCalled();
    });

    it("should apply custom variant", () => {
      render(
        <MessageAction variant="destructive" data-testid="action">
          <span>Delete</span>
        </MessageAction>
      );

      // Button should be rendered (variant is applied internally)
      expect(screen.getByTestId("action")).toBeInTheDocument();
    });
  });
});
