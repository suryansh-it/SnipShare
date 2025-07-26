// src/commands.js

const vscode = require('vscode');
const { init, search, create } = require('./services/storageManager');

async function registerCommands(context) {
  console.log('➡️ registerCommands() start');

  // guard init so it never throws
  try {
    await init();
  } catch (e) {
    console.error('⚠️ Storage init error', e);
  }

  // Register a quick test command
  context.subscriptions.push(
    vscode.commands.registerCommand('snipshare.test', () => {
      vscode.window.showInformationMessage('✅ SnipShare Test command works');
    })
  );

  // Your real commands
  const searchCmd = vscode.commands.registerCommand('snipshare.searchSnippet', async () => { /* ... */ });
  const createCmd = vscode.commands.registerCommand('snipshare.createSnippet', async () => { /* ... */ });

  context.subscriptions.push(searchCmd, createCmd);

  console.log('✅ registerCommands() complete — commands are bound');
}

module.exports = { registerCommands };
