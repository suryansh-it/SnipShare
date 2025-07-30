// src/commands.js

const vscode = require('vscode');
const storage = require('./services/storageManager');

async function registerCommands(context) {
  console.log('➡️ registerCommands() start');

  // Test
  const testCmd = vscode.commands.registerCommand('snipshare.test', () => {
    vscode.window.showInformationMessage('✅ SnipShare Test command works');
  });
  context.subscriptions.push(testCmd);

  // Search Snippet
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

      let results;
      try {
        results = await storage.search(query);
      } catch (err) {
        console.error('❌ storage.search failed:', err);
        return vscode.window.showErrorMessage('Could not fetch snippets');
      }

      console.log(`🔍 [Search] found ${results.length} matches`);
      if (results.length === 0) {
        return vscode.window.showInformationMessage(
          `No snippets found matching "${query}"`
        );
      }

      const pick = await vscode.window.showQuickPick(
        results.map(g => ({ label: g.description, id: g.id })),
        { placeHolder: 'Select snippet to insert' }
      );
      if (!pick) return;

      const chosen = results.find(g => g.id === pick.id);
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

  // Create Snippet
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
        gist = await storage.create({
          description: desc,
          files: { 'snippet.txt': { content } }
        });
      } catch (err) {
        console.error('❌ storage.create failed:', err);
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
