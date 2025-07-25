const vscode = require('vscode');
const { init, search, create } = require('./services/storageManager');

/**
 * @param {import('vscode').ExtensionContext} context
 */
async function registerCommands(context) {
  console.log('➡️ registerCommands()');

  await init();

  const searchCmd = vscode.commands.registerCommand(
    'snipshare.searchSnippet',
    async () => {
      console.log('🔍 searchSnippet invoked');
      const q = await vscode.window.showInputBox({ prompt: 'Search for a snippet' });
      if (!q) return;

      const results = await search(q);
      const picks = results.map(s => ({
        label: s.description,
        detail: Object.keys(s.files)[0],
        id: s.id
      }));
      const choice = await vscode.window.showQuickPick(picks, { placeHolder: 'Select snippet' });
      if (!choice) return;

      const snippet = results.find(s => s.id === choice.id);
      const content = Object.values(snippet.files)[0].content;
      const editor = vscode.window.activeTextEditor;
      if (editor) editor.insertSnippet(new vscode.SnippetString(content));
    }
  );

  const createCmd = vscode.commands.registerCommand(
    'snipshare.createSnippet',
    async () => {
      console.log('➕ createSnippet invoked');
      const desc = await vscode.window.showInputBox({ prompt: 'Snippet description' });
      if (!desc) return;
      const cont = await vscode.window.showInputBox({ prompt: 'Snippet content' });
      if (cont === undefined) return;

      await create({ description: desc, files: { 'snippet.txt': { content: cont } } });
      vscode.window.showInformationMessage('Snippet created');
    }
  );

  context.subscriptions.push(searchCmd, createCmd);
}

module.exports = { registerCommands };
