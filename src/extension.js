const vscode = require('vscode');
const { registerCommands } = require('./commands');
const { authenticate } = require('./auth/oauth');

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
     let token = context.globalState.get('githubToken');
  if (!token) {
    await authenticate(context);
  }
  console.log('🔌 SnipShare extension activated');
  registerCommands(context);
}

function deactivate() {
  console.log('❌ SnipShare extension deactivated');
}

module.exports = { activate, deactivate };

