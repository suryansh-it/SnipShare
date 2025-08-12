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
// src/extension.js (CommonJS)
console.log('🔧 SnipShare extension.js loaded');
const vscode = require('vscode');
const { registerCommands } = require('./commands');

/**
 * @param {import('vscode').ExtensionContext} context
 */
function activate(context) {
  console.log('🔌 SnipShare activate() running');

  // Register commands synchronously so they are available immediately
  registerCommands(context);

  // If we don't have a token, prompt the user to run Setup (paste PAT)
  const config = vscode.workspace.getConfiguration('snipshare');
  const tokenInSettings = config.get('githubToken');
  const tokenInGlobal = context.globalState.get('githubToken');

  if (!tokenInSettings && !tokenInGlobal) {
    const setupButton = 'Setup SnipShare';
    vscode.window.showInformationMessage(
      'SnipShare needs a GitHub token to sync snippets — click Setup to configure (paste a PAT).',
      setupButton
    ).then(choice => {
      if (choice === setupButton) {
        vscode.commands.executeCommand('snipshare.setup');
      }
    });
  } else {
    console.log('🔑 GitHub token found in settings or globalState — ready to use');
  }

  console.log('✅ SnipShare activated (commands registered)');
}

function deactivate() {
  console.log('❌ SnipShare deactivate()');
}

module.exports = { activate, deactivate };

