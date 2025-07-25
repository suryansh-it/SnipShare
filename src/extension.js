// Remove any `import` or `export default`

// Top‑level log to prove loading
console.log('🔧 SnipShare extension.js loaded');

const { authenticate } = require('./auth/oauth');
const { registerCommands } = require('./commands');

/**
 * @param {import('vscode').ExtensionContext} context
 */
async function activate(context) {
  console.log('🔌 SnipShare activate() running');

  let token = context.globalState.get('githubToken');
  if (!token) {
    await authenticate(context);
  }

  // await so commands are definitely registered
  await registerCommands(context);
}

function deactivate() {
  console.log('❌ SnipShare deactivate()');
}

module.exports = { activate, deactivate };
