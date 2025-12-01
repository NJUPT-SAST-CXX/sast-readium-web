# Annotations

SAST Readium provides comprehensive annotation tools for marking up PDF documents with highlights, comments, drawings, shapes, and stamps.

## Annotation Types

### Highlights

Text highlighting with customizable colors.

**How to Highlight:**

1. Select text in the PDF
2. Click a highlight color in the context menu
3. Or use the highlight tool from the toolbar

**Features:**

- Multiple colors available
- Custom color picker
- Highlights persist across sessions
- Click to select and edit

### Comments

Add text notes to any location on a page.

**How to Add Comments:**

1. Select the comment tool from the toolbar
2. Click on the page where you want the comment
3. Type your comment text
4. Click outside to save

**Features:**

- Positioned anywhere on the page
- Resizable comment boxes
- Edit or delete anytime
- Visible in annotations list

### Freehand Drawing

Draw directly on PDF pages.

**How to Draw:**

1. Select the drawing tool
2. Choose stroke color and width
3. Draw on the page
4. Click the tool again to exit drawing mode

**Settings:**

- Stroke color picker
- Stroke width (1-20px)
- Eraser tool available

### Shapes

Insert geometric shapes.

**Available Shapes:**

- Rectangle
- Circle/Ellipse
- Arrow
- Line

**How to Add Shapes:**

1. Select shape type from toolbar
2. Click and drag on the page
3. Release to complete shape
4. Adjust size and position

### Text Annotations

Add text boxes directly on pages.

**How to Add Text:**

1. Select text annotation tool
2. Click on the page
3. Type your text
4. Format as needed

### Stamps

Pre-defined or custom stamps.

**Built-in Stamps:**

- Approved
- Rejected
- Confidential
- Draft
- Final

**How to Add Stamps:**

1. Select stamp tool
2. Choose stamp type
3. Click on the page to place

### Signatures

Digital signature support.

**How to Sign:**

1. Open signature dialog
2. Draw your signature or type it
3. Click on the page to place
4. Resize and position as needed

## Annotation Toolbar

The annotation toolbar provides quick access to all tools:

```text
┌─────────────────────────────────────────────────────────────┐
│ [Highlight] [Comment] [Draw] [Shapes ▼] [Stamp ▼] [Sign]   │
│ [Color ▼] [Width ▼] [Undo] [Redo] [Clear All]              │
└─────────────────────────────────────────────────────────────┘
```

## Color Picker

### Preset Colors

Quick access to common colors:

- Yellow (default highlight)
- Green
- Blue
- Pink
- Orange
- Red
- Purple

### Custom Colors

1. Click "Custom" in color picker
2. Use color wheel or enter hex code
3. Recently used colors are saved

## Undo/Redo

Full history support for annotation actions.

| Action | Shortcut                       |
| ------ | ------------------------------ |
| Undo   | ++ctrl+z++                     |
| Redo   | ++ctrl+y++ or ++ctrl+shift+z++ |

**History Features:**

- Up to 50 undo steps
- Persists during session
- Clear history option

## Annotations List

View all annotations in one place.

**Access:**

1. Click annotations icon in sidebar
2. Or press ++ctrl+shift+a++

**Features:**

- Grouped by page
- Click to navigate to annotation
- Edit or delete from list
- Filter by type
- Sort by date or page

## Editing Annotations

### Select Annotation

- Click on any annotation to select it
- Selection handles appear for resizing
- Drag to reposition

### Edit Properties

1. Select the annotation
2. Right-click for context menu
3. Or use the properties panel

**Editable Properties:**

- Color
- Opacity
- Size/Position
- Content (for comments)

### Delete Annotation

- Select and press ++delete++
- Or right-click → Delete
- Or use the annotations list

## Keyboard Shortcuts

| Shortcut   | Action          |
| ---------- | --------------- |
| ++h++      | Highlight tool  |
| ++c++      | Comment tool    |
| ++d++      | Drawing tool    |
| ++escape++ | Deselect tool   |
| ++ctrl+z++ | Undo            |
| ++ctrl+y++ | Redo            |
| ++delete++ | Delete selected |

## Persistence

### Local Storage

Annotations are automatically saved to browser storage:

- Saved per document (by URL/path)
- Persists across sessions
- No server required

### Export Options

Export annotations for sharing:

- **JSON**: Full annotation data
- **Summary**: Text-only export

## Best Practices

### Organizing Annotations

1. Use consistent colors for categories
2. Add descriptive comments
3. Use stamps for status tracking
4. Review annotations list periodically

### Collaboration Tips

1. Export annotations to share
2. Use clear, descriptive comments
3. Date-stamp important notes
4. Use stamps for approval workflows

## Limitations

### Current Limitations

- Annotations are stored locally (not in PDF file)
- No real-time collaboration
- Export doesn't modify original PDF

### Planned Features

- PDF annotation embedding
- Cloud sync
- Collaborative annotations
- Annotation templates
