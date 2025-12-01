# AI Assistant

SAST Readium includes an integrated AI assistant that helps you understand, analyze, and interact with PDF documents using natural language.

## Overview

The AI assistant provides:

- **PDF Context Awareness**: Understands the current document content
- **Natural Language Queries**: Ask questions in plain language
- **Tool Calling**: Performs actions like searching and navigating
- **Multi-Provider Support**: Works with various AI providers
- **MCP Integration**: Connects to external tools via Model Context Protocol

## Getting Started

### Opening the AI Sidebar

- Click the AI icon in the toolbar
- Or press ++ctrl+shift+i++

### Initial Setup

1. Open AI Settings (gear icon in sidebar)
2. Select your AI provider
3. Enter your API key
4. Choose a model
5. Start chatting!

## Supported Providers

### Built-in Providers

| Provider      | Models                 | Features            |
| ------------- | ---------------------- | ------------------- |
| **OpenAI**    | GPT-4o, GPT-4, GPT-3.5 | Text, Vision, Tools |
| **Anthropic** | Claude 3.5, Claude 3   | Text, Vision, Tools |

### Custom Providers

Add any OpenAI-compatible API:

1. Open AI Settings
2. Click "Add Custom Provider"
3. Enter:
   - Provider name
   - API endpoint URL
   - API key
   - Available models

## PDF Context

### Automatic Context

The AI automatically receives context about:

- Current page content
- Document metadata
- Selected text
- Visible annotations

### Context Options

Configure what context is shared:

| Option            | Description                |
| ----------------- | -------------------------- |
| **Current Page**  | Text from the visible page |
| **Selection**     | Currently selected text    |
| **Full Document** | Entire document text       |
| **Metadata**      | Title, author, etc.        |

### Context Window

Manage context size:

- **Auto**: Adjusts based on model limits
- **Manual**: Set specific token limit
- **Minimal**: Only essential context

## Chat Features

### Basic Chat

Type your question and press ++enter++ or click Send.

**Example Questions:**

- "Summarize this page"
- "What are the main points of this document?"
- "Explain the concept on page 5"
- "Find all mentions of 'machine learning'"

### Streaming Responses

Responses stream in real-time:

- See text as it's generated
- Stop generation anytime
- Faster perceived response time

### Message History

- Conversations are saved automatically
- Access history from the History tab
- Continue previous conversations
- Export chat history

## Tool Calling

The AI can perform actions in the PDF viewer.

### Available Tools

| Tool               | Description                 |
| ------------------ | --------------------------- |
| `search_document`  | Search for text in the PDF  |
| `navigate_to_page` | Go to a specific page       |
| `get_page_content` | Read content from a page    |
| `get_selection`    | Get currently selected text |
| `highlight_text`   | Add highlight annotation    |
| `add_bookmark`     | Create a bookmark           |

### Multi-Step Execution

The AI can chain multiple tools:

1. Search for a term
2. Navigate to the result
3. Summarize the content
4. Add a bookmark

### Tool Visibility

See tool calls in the chat:

```
🔧 Searching for "neural networks"...
📄 Found 5 results
📍 Navigating to page 12...
```

## MCP Integration

### Model Context Protocol

Connect to external MCP servers for additional capabilities:

- File system access
- Database queries
- API integrations
- Custom tools

### Configuring MCP Servers

1. Open AI Settings
2. Go to "MCP Servers" section
3. Click "Add Server"
4. Enter server configuration:

```json
{
  "name": "my-server",
  "command": "npx",
  "args": ["-y", "@my/mcp-server"],
  "env": {}
}
```

### Available MCP Tools

MCP servers can provide:

- Custom search capabilities
- Data analysis tools
- External API access
- Specialized processing

## Advanced Features

### Deep Research

Multi-step research workflow:

1. Click "Deep Research" button
2. Enter your research question
3. AI performs multiple searches
4. Synthesizes findings
5. Generates comprehensive report

### Chart Insights

Analyze charts and figures:

1. Select a chart in the PDF
2. Click "Analyze Chart"
3. AI extracts data and insights
4. Provides interpretation

### Report Generation

Generate structured reports:

1. Click "Generate Report"
2. Select report template
3. AI analyzes document
4. Produces formatted report

## Settings

### Model Settings

| Setting              | Description            |
| -------------------- | ---------------------- |
| **Temperature**      | Creativity level (0-2) |
| **Max Tokens**       | Response length limit  |
| **Top P**            | Nucleus sampling       |
| **Presence Penalty** | Topic diversity        |

### Feature Toggles

| Feature          | Description                |
| ---------------- | -------------------------- |
| **Enable Tools** | Allow tool calling         |
| **Multi-Step**   | Allow chained tool calls   |
| **Stream**       | Enable streaming responses |
| **Context**      | Include PDF context        |

### Privacy Settings

| Setting          | Description                 |
| ---------------- | --------------------------- |
| **Save History** | Store conversations locally |
| **Send Context** | Share PDF content with AI   |
| **Analytics**    | Usage analytics (optional)  |

## Keyboard Shortcuts

| Shortcut         | Action            |
| ---------------- | ----------------- |
| ++ctrl+shift+i++ | Toggle AI sidebar |
| ++ctrl+enter++   | Send message      |
| ++escape++       | Cancel generation |
| ++ctrl+l++       | Clear chat        |

## Best Practices

### Effective Prompts

1. **Be specific**: "Summarize the methodology section" vs "Summarize this"
2. **Provide context**: "Based on the chart on page 3..."
3. **Ask follow-ups**: Build on previous responses
4. **Use examples**: "Format the output like..."

### Managing Costs

1. Use appropriate model for task
2. Limit context when possible
3. Use streaming to stop early
4. Monitor token usage

### Privacy Considerations

1. Review what context is shared
2. Use local models for sensitive docs
3. Clear history when needed
4. Check provider privacy policies

## Troubleshooting

### API Key Issues

- Verify key is correct
- Check key permissions
- Ensure billing is active
- Try regenerating key

### Slow Responses

- Check internet connection
- Try a faster model
- Reduce context size
- Check provider status

### Tool Failures

- Verify tool permissions
- Check PDF is loaded
- Try simpler requests
- Review error messages

## API Key Security

### Storage

- Keys are encrypted in browser storage
- Never sent to our servers
- Only sent to AI provider

### Best Practices

- Use environment variables in development
- Rotate keys periodically
- Use separate keys for different environments
- Monitor usage for anomalies
