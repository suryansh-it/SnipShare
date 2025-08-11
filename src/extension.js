// // src/extension.js (CommonJS)

// console.log('🔧 SnipShare extension.js loaded');
// const vscode = require('vscode');

// const { authenticate } = require('./auth/oauth');
// const { registerCommands } = require('./commands');

// /**
//  * @param {import('vscode').ExtensionContext} context
//  */
// async function activate(context) {
//   console.log('🔌 SnipShare activate() running');

//   let token = context.globalState.get('githubToken');
//   if (!token) {
//     try {
//       await authenticate(context);
//     } catch (err) {
//       // swallow OAuth errors so commands still get registered
//       console.error('⚠️ OAuth failed, continuing without auth:', err);
//       vscode.window.showWarningMessage('⚠️ SnipShare: GitHub authentication failed, snippets will still work locally.');
//     }
//   }

//   // Now safe to register commands, even if auth failed
//   await registerCommands(context);

//   console.log('✅ SnipShare activated (commands registered)');
// }

// function deactivate() {
//   console.log('❌ SnipShare deactivate()');
// }

// module.exports = { activate, deactivate };


// src/extension.js
console.log('🔧 SnipShare extension.js loaded');
const vscode = require('vscode');

const { authenticate } = require('./auth/oauth');
const { registerCommands } = require('./commands');

/**
 * @param {import('vscode').ExtensionContext} context
 */
function activate(context) {
  console.log('🔌 SnipShare activate() running');

  // 1) Register commands synchronously so they are available immediately.
  //    This prevents the "first command only activates, doesn't run" problem.
  registerCommands(context);

  // 2) If user has no token in settings/globalState, prompt to run setup
  const config = vscode.workspace.getConfiguration('snipshare');
  const tokenInSettings = config.get('githubToken');
  const tokenInGlobal = context.globalState.get('githubToken');

  if (!tokenInSettings && !tokenInGlobal) {
    const setupButton = 'Setup SnipShare';
    vscode.window.showInformationMessage(
      'SnipShare needs a GitHub token to sync snippets — click Setup to configure (paste a PAT or start device flow).',
      setupButton
    ).then(choice => {
      if (choice === setupButton) {
        vscode.commands.executeCommand('snipshare.setup');
      }
    });
  } else {
    // If token exists in settings or globalState, try to authenticate quietly in background.
    // Run it in the background so activation doesn't block.
    (async () => {
      try {
        await authenticate(context);
      } catch (err) {
        console.warn('⚠️ OAuth failed (background), continuing without auth:', err);
      }
    })();
  }

  console.log('✅ SnipShare activated (commands registered)');
}

function deactivate() {
  console.log('❌ SnipShare deactivate()');
}

module.exports = { activate, deactivate };
