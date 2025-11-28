/**
 * Tests for AIHistoryPanel component (components/ai-sidebar/ai-history-panel.tsx)
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { AIHistoryPanel } from "../ai-history-panel";
import { useAIChatStore } from "@/lib/ai-chat-store";

// Mock react-i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock date-fns
jest.mock("date-fns", () => ({
  formatDistanceToNow: () => "2 hours ago",
}));

// Mock window.confirm and window.prompt
const mockConfirm = jest.fn();
const mockPrompt = jest.fn();
window.confirm = mockConfirm;
window.prompt = mockPrompt;

beforeEach(() => {
  jest.clearAllMocks();
  mockConfirm.mockReturnValue(true);
  mockPrompt.mockReturnValue("New Title");

  useAIChatStore.setState({
    conversations: {},
    currentConversationId: null,
  });
});

describe("AIHistoryPanel", () => {
  describe("Empty State", () => {
    it("should show empty state when no conversations", () => {
      render(<AIHistoryPanel />);

      expect(screen.getByText("ai.no_history")).toBeInTheDocument();
      expect(screen.getByText("ai.no_history_description")).toBeInTheDocument();
    });
  });

  describe("With Conversations", () => {
    beforeEach(() => {
      useAIChatStore.setState({
        conversations: {
          conv_1: {
            id: "conv_1",
            title: "First Conversation",
            messages: [
              { id: "msg_1", role: "user", content: "Hello" },
              { id: "msg_2", role: "assistant", content: "Hi there" },
            ],
            createdAt: Date.now() - 3600000,
            updatedAt: Date.now() - 1800000,
          },
          conv_2: {
            id: "conv_2",
            title: "Second Conversation",
            messages: [{ id: "msg_3", role: "user", content: "Test" }],
            createdAt: Date.now() - 7200000,
            updatedAt: Date.now() - 3600000,
            pdfFileName: "document.pdf",
          },
        },
        currentConversationId: "conv_1",
      });
    });

    it("should render conversation list", () => {
      render(<AIHistoryPanel />);

      expect(screen.getByText("First Conversation")).toBeInTheDocument();
      expect(screen.getByText("Second Conversation")).toBeInTheDocument();
    });

    it("should show message count", () => {
      render(<AIHistoryPanel />);

      expect(screen.getByText("2 ai.messages")).toBeInTheDocument();
      expect(screen.getByText("1 ai.messages")).toBeInTheDocument();
    });

    it("should show PDF filename when available", () => {
      render(<AIHistoryPanel />);

      expect(screen.getByText("document.pdf")).toBeInTheDocument();
    });

    it("should highlight current conversation", () => {
      render(<AIHistoryPanel />);

      // The current conversation card should have the border-primary class
      const firstConversation = screen
        .getByText("First Conversation")
        .closest("[class*='cursor-pointer']");
      expect(firstConversation).toHaveClass("border-primary");
    });

    it("should select conversation on click", () => {
      render(<AIHistoryPanel />);

      fireEvent.click(screen.getByText("Second Conversation"));

      expect(useAIChatStore.getState().currentConversationId).toBe("conv_2");
    });

    it("should have dropdown menu buttons for each conversation", () => {
      render(<AIHistoryPanel />);

      // Each conversation should have a dropdown menu button
      const menuButtons = screen.getAllByRole("button");
      const dropdownButtons = menuButtons.filter((btn) =>
        btn.querySelector("svg.lucide-ellipsis-vertical")
      );

      // Should have 2 dropdown buttons (one for each conversation)
      expect(dropdownButtons.length).toBe(2);
    });

    it("should show relative time", () => {
      render(<AIHistoryPanel />);

      // The mocked formatDistanceToNow returns "2 hours ago"
      expect(screen.getAllByText("2 hours ago")).toHaveLength(2);
    });
  });
});
