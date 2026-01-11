/**
 * Tests for Confirmation components (components/ai/elements/confirmation.tsx)
 */

import { render, screen, fireEvent } from "@testing-library/react";
import {
  Confirmation,
  ConfirmationTitle,
  ConfirmationRequest,
  ConfirmationAccepted,
  ConfirmationRejected,
  ConfirmationActions,
  ConfirmationAction,
} from "../confirmation";

describe("Confirmation Components", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Confirmation", () => {
    it("should return null when no approval provided", () => {
      const { container } = render(
        <Confirmation state="output-available" data-testid="confirmation" />
      );

      expect(container.firstChild).toBeNull();
    });

    it("should return null when state is input-streaming", () => {
      const { container } = render(
        <Confirmation
          approval={{ id: "123", approved: true }}
          state="input-streaming"
          data-testid="confirmation"
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it("should return null when state is input-available", () => {
      const { container } = render(
        <Confirmation
          approval={{ id: "123", approved: true }}
          state="input-available"
          data-testid="confirmation"
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it("should render alert when approval-requested state", () => {
      render(
        <Confirmation
          approval={{ id: "123" }}
          state="approval-requested"
          data-testid="confirmation"
        >
          <ConfirmationTitle>Confirm action</ConfirmationTitle>
        </Confirmation>
      );

      expect(screen.getByTestId("confirmation")).toBeInTheDocument();
      expect(screen.getByText("Confirm action")).toBeInTheDocument();
    });

    it("should render alert when approval-responded state with approved=true", () => {
      render(
        <Confirmation
          approval={{ id: "123", approved: true }}
          state="approval-responded"
          data-testid="confirmation"
        >
          <ConfirmationTitle>Action was approved</ConfirmationTitle>
        </Confirmation>
      );

      expect(screen.getByTestId("confirmation")).toBeInTheDocument();
    });

    it("should render alert when approval-responded state with approved=false", () => {
      render(
        <Confirmation
          approval={{ id: "123", approved: false }}
          state="approval-responded"
          data-testid="confirmation"
        >
          <ConfirmationTitle>Action was rejected</ConfirmationTitle>
        </Confirmation>
      );

      expect(screen.getByTestId("confirmation")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(
        <Confirmation
          approval={{ id: "123" }}
          state="approval-requested"
          className="custom-confirmation"
          data-testid="confirmation"
        />
      );

      expect(screen.getByTestId("confirmation")).toHaveClass(
        "custom-confirmation"
      );
    });
  });

  describe("ConfirmationTitle", () => {
    it("should render children", () => {
      render(
        <Confirmation approval={{ id: "123" }} state="approval-requested">
          <ConfirmationTitle>Confirmation Title</ConfirmationTitle>
        </Confirmation>
      );

      expect(screen.getByText("Confirmation Title")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(
        <Confirmation approval={{ id: "123" }} state="approval-requested">
          <ConfirmationTitle className="custom-title" data-testid="title">
            Title
          </ConfirmationTitle>
        </Confirmation>
      );

      expect(screen.getByTestId("title")).toHaveClass("custom-title");
    });
  });

  describe("ConfirmationRequest", () => {
    it("should render when state is approval-requested", () => {
      render(
        <Confirmation approval={{ id: "123" }} state="approval-requested">
          <ConfirmationRequest>
            <span>Please confirm</span>
          </ConfirmationRequest>
        </Confirmation>
      );

      expect(screen.getByText("Please confirm")).toBeInTheDocument();
    });

    it("should not render when state is not approval-requested", () => {
      render(
        <Confirmation approval={{ id: "123" }} state="approval-responded">
          <ConfirmationRequest>
            <span>Should not render</span>
          </ConfirmationRequest>
        </Confirmation>
      );

      expect(screen.queryByText("Should not render")).not.toBeInTheDocument();
    });

    it("should render null children safely", () => {
      const { container } = render(
        <Confirmation approval={{ id: "123" }} state="approval-requested">
          <ConfirmationRequest>{null}</ConfirmationRequest>
        </Confirmation>
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe("ConfirmationAccepted", () => {
    it("should render when approved=true and state is approval-responded", () => {
      render(
        <Confirmation
          approval={{ id: "123", approved: true }}
          state="approval-responded"
        >
          <ConfirmationAccepted>
            <span>Action approved</span>
          </ConfirmationAccepted>
        </Confirmation>
      );

      expect(screen.getByText("Action approved")).toBeInTheDocument();
    });

    it("should render when approved=true and state is output-available", () => {
      render(
        <Confirmation
          approval={{ id: "123", approved: true }}
          state="output-available"
        >
          <ConfirmationAccepted>
            <span>Action completed</span>
          </ConfirmationAccepted>
        </Confirmation>
      );

      expect(screen.getByText("Action completed")).toBeInTheDocument();
    });

    it("should render when approved=true and state is output-denied", () => {
      render(
        <Confirmation
          approval={{ id: "123", approved: true }}
          state="output-denied"
        >
          <ConfirmationAccepted>
            <span>Access denied but approved</span>
          </ConfirmationAccepted>
        </Confirmation>
      );

      expect(
        screen.getByText("Access denied but approved")
      ).toBeInTheDocument();
    });

    it("should not render when approved=false", () => {
      render(
        <Confirmation
          approval={{ id: "123", approved: false }}
          state="approval-responded"
        >
          <ConfirmationAccepted>
            <span>Should not render</span>
          </ConfirmationAccepted>
        </Confirmation>
      );

      expect(screen.queryByText("Should not render")).not.toBeInTheDocument();
    });

    it("should not render when state is approval-requested", () => {
      render(
        <Confirmation
          approval={{ id: "123", approved: true }}
          state="approval-requested"
        >
          <ConfirmationAccepted>
            <span>Should not render</span>
          </ConfirmationAccepted>
        </Confirmation>
      );

      expect(screen.queryByText("Should not render")).not.toBeInTheDocument();
    });
  });

  describe("ConfirmationRejected", () => {
    it("should render when approved=false and state is approval-responded", () => {
      render(
        <Confirmation
          approval={{ id: "123", approved: false }}
          state="approval-responded"
        >
          <ConfirmationRejected>
            <span>Action rejected</span>
          </ConfirmationRejected>
        </Confirmation>
      );

      expect(screen.getByText("Action rejected")).toBeInTheDocument();
    });

    it("should render when approved=false and state is output-available", () => {
      render(
        <Confirmation
          approval={{ id: "123", approved: false }}
          state="output-available"
        >
          <ConfirmationRejected>
            <span>Rejected</span>
          </ConfirmationRejected>
        </Confirmation>
      );

      expect(screen.getByText("Rejected")).toBeInTheDocument();
    });

    it("should not render when approved=true", () => {
      render(
        <Confirmation
          approval={{ id: "123", approved: true }}
          state="approval-responded"
        >
          <ConfirmationRejected>
            <span>Should not render</span>
          </ConfirmationRejected>
        </Confirmation>
      );

      expect(screen.queryByText("Should not render")).not.toBeInTheDocument();
    });

    it("should not render when state is approval-requested", () => {
      render(
        <Confirmation
          approval={{ id: "123", approved: false }}
          state="approval-requested"
        >
          <ConfirmationRejected>
            <span>Should not render</span>
          </ConfirmationRejected>
        </Confirmation>
      );

      expect(screen.queryByText("Should not render")).not.toBeInTheDocument();
    });
  });

  describe("ConfirmationActions", () => {
    it("should render when state is approval-requested", () => {
      render(
        <Confirmation
          approval={{ id: "123" }}
          state="approval-requested"
          data-testid="confirmation"
        >
          <ConfirmationActions data-testid="actions">
            <button>Accept</button>
            <button>Reject</button>
          </ConfirmationActions>
        </Confirmation>
      );

      expect(screen.getByTestId("actions")).toBeInTheDocument();
      expect(screen.getByText("Accept")).toBeInTheDocument();
      expect(screen.getByText("Reject")).toBeInTheDocument();
    });

    it("should not render when state is not approval-requested", () => {
      render(
        <Confirmation
          approval={{ id: "123", approved: true }}
          state="approval-responded"
        >
          <ConfirmationActions data-testid="actions">
            <button>Should not render</button>
          </ConfirmationActions>
        </Confirmation>
      );

      expect(screen.queryByTestId("actions")).not.toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(
        <Confirmation approval={{ id: "123" }} state="approval-requested">
          <ConfirmationActions
            className="custom-actions"
            data-testid="actions"
          />
        </Confirmation>
      );

      expect(screen.getByTestId("actions")).toHaveClass("custom-actions");
    });
  });

  describe("ConfirmationAction", () => {
    it("should render button", () => {
      render(
        <Confirmation approval={{ id: "123" }} state="approval-requested">
          <ConfirmationActions>
            <ConfirmationAction data-testid="action-button">
              Approve
            </ConfirmationAction>
          </ConfirmationActions>
        </Confirmation>
      );

      expect(screen.getByTestId("action-button")).toBeInTheDocument();
      expect(screen.getByRole("button")).toHaveAttribute("type", "button");
    });

    it("should handle click events", () => {
      const handleClick = jest.fn();
      render(
        <Confirmation approval={{ id: "123" }} state="approval-requested">
          <ConfirmationActions>
            <ConfirmationAction onClick={handleClick} data-testid="action">
              Click me
            </ConfirmationAction>
          </ConfirmationActions>
        </Confirmation>
      );

      fireEvent.click(screen.getByTestId("action"));
      expect(handleClick).toHaveBeenCalled();
    });

    it("should render children", () => {
      render(
        <Confirmation approval={{ id: "123" }} state="approval-requested">
          <ConfirmationActions>
            <ConfirmationAction>
              <span>Custom button text</span>
            </ConfirmationAction>
          </ConfirmationActions>
        </Confirmation>
      );

      expect(screen.getByText("Custom button text")).toBeInTheDocument();
    });

    it("should be disabled when disabled prop is true", () => {
      render(
        <Confirmation approval={{ id: "123" }} state="approval-requested">
          <ConfirmationActions>
            <ConfirmationAction disabled data-testid="action">
              Disabled
            </ConfirmationAction>
          </ConfirmationActions>
        </Confirmation>
      );

      expect(screen.getByTestId("action")).toBeDisabled();
    });
  });

  describe("Integration: Complete approval workflow", () => {
    it("should show request state, then accepted state", () => {
      const { rerender } = render(
        <Confirmation approval={{ id: "123" }} state="approval-requested">
          <ConfirmationTitle>Approve action?</ConfirmationTitle>
          <ConfirmationRequest>
            <span>Please review and approve</span>
          </ConfirmationRequest>
          <ConfirmationActions>
            <ConfirmationAction>Approve</ConfirmationAction>
          </ConfirmationActions>
          <ConfirmationAccepted>
            <span>Action approved!</span>
          </ConfirmationAccepted>
        </Confirmation>
      );

      expect(screen.getByText("Please review and approve")).toBeInTheDocument();
      expect(screen.queryByText("Action approved!")).not.toBeInTheDocument();

      // Rerender with approved state
      rerender(
        <Confirmation
          approval={{ id: "123", approved: true }}
          state="approval-responded"
        >
          <ConfirmationTitle>Action approved</ConfirmationTitle>
          <ConfirmationRequest>
            <span>Please review and approve</span>
          </ConfirmationRequest>
          <ConfirmationActions>
            <ConfirmationAction>Approve</ConfirmationAction>
          </ConfirmationActions>
          <ConfirmationAccepted>
            <span>Action approved!</span>
          </ConfirmationAccepted>
        </Confirmation>
      );

      expect(
        screen.queryByText("Please review and approve")
      ).not.toBeInTheDocument();
      expect(screen.getByText("Action approved!")).toBeInTheDocument();
    });

    it("should show rejection state", () => {
      render(
        <Confirmation
          approval={{ id: "123", approved: false }}
          state="approval-responded"
        >
          <ConfirmationTitle>Action rejected</ConfirmationTitle>
          <ConfirmationRejected>
            <span>Action was not approved</span>
          </ConfirmationRejected>
        </Confirmation>
      );

      expect(screen.getByText("Action was not approved")).toBeInTheDocument();
    });
  });
});
