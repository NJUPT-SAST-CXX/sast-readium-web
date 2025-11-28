/**
 * Tests for Conversation components (components/ai-elements/conversation.tsx)
 */

import { render, screen } from "@testing-library/react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
} from "../conversation";

// Mock the use-stick-to-bottom library
jest.mock("use-stick-to-bottom", () => ({
  StickToBottom: ({
    children,
    className,
    ...props
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={className} data-testid="stick-to-bottom" {...props}>
      {children}
    </div>
  ),
  useStickToBottomContext: () => ({
    isAtBottom: true,
    scrollToBottom: jest.fn(),
  }),
}));

// Add Content property to StickToBottom mock
const StickToBottomMock = jest.requireMock("use-stick-to-bottom").StickToBottom;
const MockContent = ({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={className} data-testid="stick-to-bottom-content" {...props}>
    {children}
  </div>
);
MockContent.displayName = "StickToBottom.Content";
StickToBottomMock.Content = MockContent;

describe("Conversation Components", () => {
  describe("Conversation", () => {
    it("should render children", () => {
      render(
        <Conversation>
          <span>Message content</span>
        </Conversation>
      );

      expect(screen.getByText("Message content")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(
        <Conversation className="custom-conversation">
          <span>Content</span>
        </Conversation>
      );

      const container = screen.getByTestId("stick-to-bottom");
      expect(container).toHaveClass("custom-conversation");
    });

    it("should have log role for accessibility", () => {
      render(
        <Conversation>
          <span>Content</span>
        </Conversation>
      );

      expect(screen.getByRole("log")).toBeInTheDocument();
    });
  });

  describe("ConversationContent", () => {
    it("should render children", () => {
      render(
        <ConversationContent>
          <span>Message 1</span>
          <span>Message 2</span>
        </ConversationContent>
      );

      expect(screen.getByText("Message 1")).toBeInTheDocument();
      expect(screen.getByText("Message 2")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(
        <ConversationContent className="custom-content">
          <span>Content</span>
        </ConversationContent>
      );

      const content = screen.getByTestId("stick-to-bottom-content");
      expect(content).toHaveClass("custom-content");
    });
  });

  describe("ConversationEmptyState", () => {
    it("should render default title and description", () => {
      render(<ConversationEmptyState />);

      expect(screen.getByText("No messages yet")).toBeInTheDocument();
      expect(
        screen.getByText("Start a conversation to see messages here")
      ).toBeInTheDocument();
    });

    it("should render custom title", () => {
      render(<ConversationEmptyState title="Custom Title" />);

      expect(screen.getByText("Custom Title")).toBeInTheDocument();
    });

    it("should render custom description", () => {
      render(<ConversationEmptyState description="Custom description text" />);

      expect(screen.getByText("Custom description text")).toBeInTheDocument();
    });

    it("should render icon when provided", () => {
      render(
        <ConversationEmptyState
          icon={<span data-testid="custom-icon">🤖</span>}
        />
      );

      expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
    });

    it("should render children instead of default content", () => {
      render(
        <ConversationEmptyState>
          <span>Custom empty state content</span>
        </ConversationEmptyState>
      );

      expect(
        screen.getByText("Custom empty state content")
      ).toBeInTheDocument();
      expect(screen.queryByText("No messages yet")).not.toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(
        <ConversationEmptyState
          className="custom-empty-state"
          data-testid="empty-state"
        />
      );

      expect(screen.getByTestId("empty-state")).toHaveClass(
        "custom-empty-state"
      );
    });

    it("should not render description when not provided", () => {
      render(<ConversationEmptyState title="Title" description="" />);

      expect(screen.getByText("Title")).toBeInTheDocument();
      // Empty description should not render the paragraph
    });
  });
});
