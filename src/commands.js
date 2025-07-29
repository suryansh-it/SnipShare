// src/commands.js

const vscode = require('vscode');
const { listGists, createGist } = require('./services/gistService');

/**
 * Register SnipShare commands.
 * @param {vscode.ExtensionContext} context
 */
async function registerCommands(context) {
  console.log('➡️ registerCommands() start');

  // 1) Test command
  const testCmd = vscode.commands.registerCommand('snipshare.test', () => {
    vscode.window.showInformationMessage('✅ SnipShare Test command works');
  });
  context.subscriptions.push(testCmd);

  // 2) Search Snippet
  const searchCmd = vscode.commands.registerCommand(
    'snipshare.searchSnippet',
    async () => {
      console.log('🔍 [Search] starting');
      const query = await vscode.window.showInputBox({
        prompt: '🔍 Search for a snippet (by description)'
      });
      if (!query) {
        console.log('🔍 [Search] canceled');
        return;
      }
      let all;
      try {
        all = await listGists(context);
      } catch (err) {
        console.error('❌ listGists failed:', err);
        return vscode.window.showErrorMessage('Could not fetch snippets');
      }
      const matches = all.filter(g => g.description.includes(query));
      console.log(`🔍 [Search] found ${matches.length} matches`);
      if (matches.length === 0) {
        return vscode.window.showInformationMessage(
          `No snippets found matching "${query}"`
        );
      }
      const pick = await vscode.window.showQuickPick(
        matches.map(g => ({ label: g.description, id: g.id })),
        { placeHolder: 'Select snippet to insert' }
      );
      if (!pick) return;
      const chosen = matches.find(g => g.id === pick.id);
      const content = Object.values(chosen.files)[0].content;
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        editor.insertSnippet(new vscode.SnippetString(content));
        vscode.window.showInformationMessage(
          `Inserted snippet "${chosen.description}"`
        );
      } else {
        vscode.window.showErrorMessage('No active editor');
      }
    }
  );
  context.subscriptions.push(searchCmd);

  // 3) Create Snippet
  const createCmd = vscode.commands.registerCommand(
    'snipshare.createSnippet',
    async () => {
      console.log('➕ [Create] starting');
      const desc = await vscode.window.showInputBox({
        prompt: '📝 Snippet description'
      });
      if (!desc) return;
      const content = await vscode.window.showInputBox({
        prompt: '💾 Snippet content'
      });
      if (content == null) return;
      console.log(`➕ [Create] desc=${desc}`);
      let gist;
      try {
        gist = await createGist(context, {
          description: desc,
          files: { 'snippet.txt': { content } }
        });
      } catch (err) {
        console.error('❌ createGist failed:', err);
        return vscode.window.showErrorMessage('Could not create snippet');
      }
      vscode.window.showInformationMessage(
        `Created snippet "${desc}" (Gist ID: ${gist.id})`
      );
    }
  );
  context.subscriptions.push(createCmd);

  console.log('✅ registerCommands() complete — commands are bound');
}

module.exports = { registerCommands };
