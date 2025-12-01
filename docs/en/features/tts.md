# Text-to-Speech

SAST Readium includes a built-in text-to-speech (TTS) feature that reads PDF content aloud, making documents accessible and enabling hands-free reading.

## Overview

The TTS feature uses the Web Speech API to convert PDF text to spoken audio, with customizable voice, speed, and volume settings.

## Getting Started

### Starting TTS

1. Open a PDF document
2. Click the TTS button in the toolbar (speaker icon)
3. Or press ++ctrl+shift+s++
4. Reading begins from the current page

### Stopping TTS

- Click the TTS button again
- Or press ++ctrl+shift+s++
- Or press ++escape++

## Controls

### Playback Controls

| Control        | Action                  |
| -------------- | ----------------------- |
| **Play/Pause** | Toggle reading          |
| **Stop**       | Stop and reset          |
| **Previous**   | Go to previous sentence |
| **Next**       | Skip to next sentence   |

### Reading Progress

- Current sentence is highlighted
- Progress bar shows position
- Page automatically advances

## Settings

### Voice Selection

Choose from available system voices:

1. Open TTS settings
2. Select voice from dropdown
3. Preview with "Test" button

**Available Voices:**

- System default
- Language-specific voices
- Male/Female options (varies by system)

### Speed Control

Adjust reading speed:

| Speed | Description      |
| ----- | ---------------- |
| 0.5x  | Very slow        |
| 0.75x | Slow             |
| 1.0x  | Normal (default) |
| 1.25x | Slightly fast    |
| 1.5x  | Fast             |
| 2.0x  | Very fast        |

### Volume Control

Adjust volume from 0% to 100%.

### Pitch Control

Adjust voice pitch:

- Lower values = deeper voice
- Higher values = higher voice
- Default = 1.0

## Reading Modes

### Page Mode

Reads the current page, then stops.

### Continuous Mode

Reads through the entire document:

- Automatically advances pages
- Continues until stopped
- Remembers position if paused

### Selection Mode

Reads only selected text:

1. Select text in the PDF
2. Right-click → "Read Aloud"
3. Or use keyboard shortcut

## Highlighting

### Current Sentence

The sentence being read is highlighted:

- Yellow background by default
- Customizable highlight color
- Scrolls into view automatically

### Word Highlighting

Optional word-by-word highlighting:

- Each word highlights as spoken
- Helps follow along
- Enable in settings

## Keyboard Shortcuts

| Shortcut         | Action                         |
| ---------------- | ------------------------------ |
| ++ctrl+shift+s++ | Toggle TTS                     |
| ++space++        | Pause/Resume (when TTS active) |
| ++arrow-left++   | Previous sentence              |
| ++arrow-right++  | Next sentence                  |
| ++escape++       | Stop TTS                       |
| ++plus++         | Increase speed                 |
| ++minus++        | Decrease speed                 |

## Language Support

### Automatic Detection

TTS attempts to detect document language:

- Uses PDF metadata
- Falls back to content analysis
- Can be manually overridden

### Manual Language Selection

1. Open TTS settings
2. Select language
3. Choose appropriate voice

### Supported Languages

Depends on system voices, typically includes:

- English (US, UK, AU)
- Chinese (Mandarin, Cantonese)
- Spanish
- French
- German
- Japanese
- Korean
- And many more...

## Accessibility

### Screen Reader Compatibility

TTS works alongside screen readers:

- Announces state changes
- Provides ARIA labels
- Keyboard accessible

### Visual Indicators

- Play/pause button state
- Progress indicator
- Current position marker

## Best Practices

### For Long Documents

1. Use continuous mode
2. Set comfortable speed
3. Use bookmarks to mark positions
4. Take breaks as needed

### For Study

1. Follow along with highlighting
2. Pause to take notes
3. Replay difficult sections
4. Adjust speed for comprehension

### For Accessibility

1. Test different voices
2. Find comfortable settings
3. Use keyboard shortcuts
4. Combine with zoom for visibility

## Troubleshooting

### No Audio

1. Check system volume
2. Verify browser permissions
3. Try a different voice
4. Refresh the page

### Wrong Language

1. Manually select language
2. Choose appropriate voice
3. Check PDF language metadata

### Choppy Audio

1. Reduce browser tabs
2. Close other applications
3. Try a simpler voice
4. Check system resources

### Text Not Reading

1. Ensure PDF has text layer
2. Try OCR for scanned documents
3. Check text selection works
4. Verify page has content

## Limitations

### Current Limitations

- Requires text layer in PDF
- Quality depends on system voices
- May mispronounce technical terms
- Limited formatting awareness

### Browser Support

| Browser | Support |
| ------- | ------- |
| Chrome  | Full    |
| Firefox | Full    |
| Safari  | Full    |
| Edge    | Full    |

### Desktop App

In Tauri desktop app:

- Uses system TTS engine
- May have different voices
- Generally better performance
