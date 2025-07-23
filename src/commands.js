

const vscode = require('vscode');

/**
 * Register all extension commands
 * @param {vscode.ExtensionContext} context
 */
function registerCommands(context) {
  // Search Snippet
  let searchCmd = vscode.commands.registerCommand('snipshare.searchSnippet', async () => {
    const query = await vscode.window.showInputBox({ prompt: 'Search for a snippet' });
    if (!query) return;
    // TODO: call storageManager.search(query) and show results
    vscode.window.showInformationMessage(`Searching for: ${query}`);
  });

  // Create Snippet
  let createCmd = vscode.commands.registerCommand('snipshare.createSnippet', async () => {
    const title = await vscode.window.showInputBox({ prompt: 'Snippet title' });
    if (!title) return;
    // TODO: open new editor or input snippet body
    vscode.window.showInformationMessage(`Creating snippet: ${title}`);
  });

  context.subscriptions.push(searchCmd, createCmd);
}

module.exports = { registerCommands };
