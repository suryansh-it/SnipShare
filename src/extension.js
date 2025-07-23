const vscode = require('vscode');
const { registerCommands } = require('./commands');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log('🔌 SnipShare extension activated');
  registerCommands(context);
}

function deactivate() {
  console.log('❌ SnipShare extension deactivated');
}

module.exports = { activate, deactivate };

