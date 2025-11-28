// Mock for use-stick-to-bottom ESM module

const React = require("react");

const StickToBottomContext = React.createContext(null);

const useStickToBottom = () => ({
  isAtBottom: true,
  scrollToBottom: jest.fn(),
});

const StickToBottom = ({ children, className, ...props }) => {
  return React.createElement(
    "div",
    { className, "data-testid": "stick-to-bottom", ...props },
    children
  );
};

StickToBottom.Content = ({ children, className, ...props }) => {
  return React.createElement(
    "div",
    { className, "data-testid": "stick-to-bottom-content", ...props },
    children
  );
};

StickToBottom.Provider = ({ children }) => {
  const value = {
    isAtBottom: true,
    scrollToBottom: jest.fn(),
  };
  return React.createElement(
    StickToBottomContext.Provider,
    { value },
    children
  );
};

module.exports = {
  useStickToBottom,
  StickToBottom,
  StickToBottomContext,
};
