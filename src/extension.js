// src/extension.js (CommonJS)

console.log('🔧 SnipShare extension.js loaded');
const vscode = require('vscode');

const { authenticate } = require('./auth/oauth');
const { registerCommands } = require('./commands');

/**
 * @param {import('vscode').ExtensionContext} context
 */
async function activate(context) {
  console.log('🔌 SnipShare activate() running');

  let token = context.globalState.get('githubToken');
  if (!token) {
    try {
      await authenticate(context);
    } catch (err) {
      // swallow OAuth errors so commands still get registered
      console.error('⚠️ OAuth failed, continuing without auth:', err);
      vscode.window.showWarningMessage('⚠️ SnipShare: GitHub authentication failed, snippets will still work locally.');
    }
  }

  // Now safe to register commands, even if auth failed
  await registerCommands(context);

  console.log('✅ SnipShare activated (commands registered)');
}

function deactivate() {
  console.log('❌ SnipShare deactivate()');
}

module.exports = { activate, deactivate };
