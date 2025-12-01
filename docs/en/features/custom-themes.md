# Custom Themes

SAST Readium allows you to create, customize, and share color themes for a personalized reading experience.

## Theme System

### Built-in Themes

The app includes three base themes:

| Theme     | Description                               |
| --------- | ----------------------------------------- |
| **Light** | Default light theme with white background |
| **Dark**  | Dark mode with reduced eye strain         |
| **Sepia** | Warm tones for comfortable reading        |

### Custom Themes

Create your own themes with full control over 35+ color variables.

## Creating Custom Themes

### From Settings

1. Open Settings (++ctrl+comma++ or gear icon)
2. Navigate to "Custom Themes" tab
3. Click "Create New Theme"
4. Configure colors and settings
5. Click "Save"

### From Preset

1. Open Custom Themes settings
2. Click "Presets" dropdown
3. Select a preset theme
4. Customize as needed
5. Save with a new name

## Theme Editor

### Basic Settings

| Setting           | Description               |
| ----------------- | ------------------------- |
| **Name**          | Theme display name        |
| **Description**   | Optional description      |
| **Border Radius** | Corner roundness (0-1rem) |

### Color Categories

#### Background Colors

- `background` - Main background
- `foreground` - Main text color
- `card` - Card/panel background
- `card-foreground` - Card text color
- `popover` - Popover background
- `popover-foreground` - Popover text

#### Primary Colors

- `primary` - Primary action color
- `primary-foreground` - Text on primary

#### Secondary Colors

- `secondary` - Secondary elements
- `secondary-foreground` - Text on secondary

#### Accent Colors

- `accent` - Accent highlights
- `accent-foreground` - Text on accent

#### Semantic Colors

- `destructive` - Error/danger actions
- `destructive-foreground` - Text on destructive
- `muted` - Muted/disabled elements
- `muted-foreground` - Muted text

#### UI Colors

- `border` - Border color
- `input` - Input field border
- `ring` - Focus ring color

### Color Picker

The color picker supports:

- **HSL sliders** - Hue, Saturation, Lightness
- **Hex input** - Direct hex code entry
- **RGB input** - Red, Green, Blue values
- **Eyedropper** - Pick color from screen

## Preset Themes

### Ocean Blue

Cool blue tones for a calm reading experience.

```css
--primary: 210 100% 50%;
--background: 210 50% 98%;
--accent: 200 100% 45%;
```

### Forest Green

Natural green palette inspired by nature.

```css
--primary: 142 76% 36%;
--background: 140 30% 98%;
--accent: 160 84% 39%;
```

### Rose Pink

Warm pink accents for a soft appearance.

```css
--primary: 346 77% 50%;
--background: 350 50% 98%;
--accent: 330 80% 60%;
```

### Midnight Purple

Deep purple theme for night reading.

```css
--primary: 270 70% 50%;
--background: 270 30% 10%;
--accent: 280 80% 60%;
```

### Sunset Orange

Warm orange tones reminiscent of sunset.

```css
--primary: 25 95% 53%;
--background: 30 50% 98%;
--accent: 15 90% 55%;
```

## Managing Themes

### Edit Theme

1. Select theme from list
2. Click "Edit" button
3. Modify settings
4. Click "Save"

### Duplicate Theme

1. Select theme to copy
2. Click "Duplicate"
3. Rename the copy
4. Customize as needed

### Delete Theme

1. Select theme
2. Click "Delete"
3. Confirm deletion

!!! warning
Deleted themes cannot be recovered. Export important themes before deleting.

## Import/Export

### Export Themes

Share your themes with others:

1. Select themes to export
2. Click "Export"
3. Save the JSON file

**Export Format:**

```json
{
  "version": 1,
  "exportedAt": 1699999999999,
  "themes": [
    {
      "id": "theme-123",
      "name": "My Custom Theme",
      "description": "A beautiful custom theme",
      "colors": {
        "background": "0 0% 100%",
        "foreground": "222.2 84% 4.9%",
        "primary": "221.2 83.2% 53.3%"
      },
      "radius": 0.5,
      "createdAt": 1699999999999,
      "updatedAt": 1699999999999
    }
  ]
}
```

### Import Themes

Load themes from a file:

1. Click "Import"
2. Select JSON file
3. Choose themes to import
4. Click "Import Selected"

## Applying Themes

### Quick Apply

1. Open theme dropdown in toolbar
2. Select custom theme
3. Theme applies immediately

### Set as Default

1. Apply the theme
2. Open Settings
3. Enable "Use as default theme"

### Auto Theme

Custom themes work with auto theme detection:

- Light custom theme for light mode
- Dark custom theme for dark mode

## Best Practices

### Accessibility

- Ensure sufficient contrast ratios
- Test with color blindness simulators
- Maintain readable text sizes

### Consistency

- Use related colors for harmony
- Keep semantic colors meaningful
- Test all UI elements

### Sharing

- Include descriptive names
- Add descriptions for context
- Test on different devices

## Troubleshooting

### Theme Not Applying

1. Clear browser cache
2. Refresh the page
3. Re-select the theme

### Colors Look Wrong

1. Check color format (HSL)
2. Verify contrast ratios
3. Test in different modes

### Import Fails

1. Verify JSON format
2. Check version compatibility
3. Validate color values
