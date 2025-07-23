const vscode = require('vscode');
const storageManager = require('./services/storageManager');

/**
 * Register all extension commands
 * @param {vscode.ExtensionContext} context
 */
  async function registerCommands(context) {

    // Initialize storage
  await storageManager.init();

  // Search Snippet
  let searchCmd = vscode.commands.registerCommand('snipshare.searchSnippet', async () => {
    const query = await vscode.window.showInputBox({ prompt: 'Search for a snippet' });
    if (!query) return;
     const results = await storageManager.search(query);
    const picks = results.map(s => ({ label: s.description, detail: Object.keys(s.files)[0], id: s.id }));
    const choice = await vscode.window.showQuickPick(picks, { placeHolder: 'Select snippet to insert' });
    if (!choice) return;
    const snippet = results.find(s => s.id === choice.id);
    const content = Object.values(snippet.files)[0].content;
    const editor = vscode.window.activeTextEditor;
    if (editor) editor.insertSnippet(new vscode.SnippetString(content));
    vscode.window.showInformationMessage(`Searching for: ${query}`);
  });

  // Create Snippet
  let createCmd = vscode.commands.registerCommand('snipshare.createSnippet', async () => {
    const description = await vscode.window.showInputBox({ prompt: 'Snippet description' });
    if (!description) return;
    const content = await vscode.window.showInputBox({ prompt: 'Snippet content' });
    if (content === undefined) return;
    const files = { 'snippet.txt': { content } };
    await storageManager.create({ description, files });
    vscode.window.showInformationMessage('Snippet created');
    vscode.window.showInformationMessage(`Creating snippet: ${title}`);
  });

  context.subscriptions.push(searchCmd, createCmd);
}

module.exports = { registerCommands };
