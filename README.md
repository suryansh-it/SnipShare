# SnipShare VS Code Plugin

Zero‑cost, GitHub Gists–powered snippet manager for VS Code.

## Features

- Search and insert snippets from your GitHub Gists
- Create new private snippets
- Offline access via IndexedDB

## Installation

1. Clone this repo
2. Run `npm install`
3. Press F5 in VS Code to launch the extension

## Configuration

- Set your GitHub OAuth token:
  1. Open Command Palette → `Preferences: Open Settings (JSON)`
  2. Add:
     ```json
     "snipshare.githubToken": "YOUR_TOKEN_HERE"
     ```

## Usage

- **Search**: `Ctrl+Shift+S` → type query → select snippet → inserted at cursor
- **Create**: Command Palette → `SnipShare: Create Snippet` → follow prompts

## Roadmap

- Tag-based filtering
- Snippet editing
- Fuzzy/semantic search

## License

MIT
