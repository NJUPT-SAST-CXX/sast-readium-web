import { createEditorShortcuts } from "../keyboard-shortcuts";

describe("keyboard-shortcuts", () => {
  describe("createEditorShortcuts", () => {
    it("should create empty array when no actions provided", () => {
      const shortcuts = createEditorShortcuts({});
      expect(shortcuts).toEqual([]);
    });

    it("should create bold shortcut when onBold is provided", () => {
      const onBold = jest.fn();
      const shortcuts = createEditorShortcuts({ onBold });

      expect(shortcuts).toHaveLength(1);
      expect(shortcuts[0]).toMatchObject({
        key: "b",
        ctrl: true,
        description: "Bold",
      });

      shortcuts[0].action();
      expect(onBold).toHaveBeenCalled();
    });

    it("should create italic shortcut when onItalic is provided", () => {
      const onItalic = jest.fn();
      const shortcuts = createEditorShortcuts({ onItalic });

      expect(shortcuts).toHaveLength(1);
      expect(shortcuts[0]).toMatchObject({
        key: "i",
        ctrl: true,
        description: "Italic",
      });
    });

    it("should create multiple shortcuts for multiple actions", () => {
      const actions = {
        onBold: jest.fn(),
        onItalic: jest.fn(),
        onSave: jest.fn(),
        onUndo: jest.fn(),
      };
      const shortcuts = createEditorShortcuts(actions);

      expect(shortcuts.length).toBeGreaterThanOrEqual(4);
    });

    it("should create redo shortcuts with both Ctrl+Shift+Z and Ctrl+Y", () => {
      const onRedo = jest.fn();
      const shortcuts = createEditorShortcuts({ onRedo });

      // Should have two shortcuts for redo
      expect(shortcuts).toHaveLength(2);

      const ctrlShiftZ = shortcuts.find(
        (s) => s.key === "z" && s.ctrl && s.shift
      );
      const ctrlY = shortcuts.find((s) => s.key === "y" && s.ctrl);

      expect(ctrlShiftZ).toBeDefined();
      expect(ctrlY).toBeDefined();
    });

    it("should create heading shortcuts with Ctrl+Shift+number", () => {
      const actions = {
        onHeading1: jest.fn(),
        onHeading2: jest.fn(),
        onHeading3: jest.fn(),
      };
      const shortcuts = createEditorShortcuts(actions);

      expect(shortcuts).toHaveLength(3);
      expect(shortcuts[0]).toMatchObject({
        key: "1",
        ctrl: true,
        shift: true,
      });
      expect(shortcuts[1]).toMatchObject({
        key: "2",
        ctrl: true,
        shift: true,
      });
      expect(shortcuts[2]).toMatchObject({
        key: "3",
        ctrl: true,
        shift: true,
      });
    });

    it("should create line operation shortcuts", () => {
      const actions = {
        onMoveLineUp: jest.fn(),
        onMoveLineDown: jest.fn(),
        onDuplicateLine: jest.fn(),
      };
      const shortcuts = createEditorShortcuts(actions);

      expect(shortcuts).toHaveLength(3);

      const moveUp = shortcuts.find((s) => s.key === "ArrowUp" && s.alt);
      const moveDown = shortcuts.find((s) => s.key === "ArrowDown" && s.alt);
      const duplicate = shortcuts.find((s) => s.key === "d" && s.ctrl);

      expect(moveUp).toBeDefined();
      expect(moveDown).toBeDefined();
      expect(duplicate).toBeDefined();
    });
  });
});
