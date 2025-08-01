// src/commands.js

const vscode = require('vscode');
const storage = require('./services/storageManager');
const { getGist } = require('./services/gistService');
const debugChannel = vscode.window.createOutputChannel('SnipShare Debug');

async function registerCommands(context) {
  debugChannel.appendLine('➡️ registerCommands() start');

  // Test Command
  const testCmd = vscode.commands.registerCommand('snipshare.test', () => {
    vscode.window.showInformationMessage('✅ SnipShare Test command works');
    debugChannel.appendLine('✔️ Test command invoked');
  });
  context.subscriptions.push(testCmd);

 // 2) Search Snippet
  const searchCmd = vscode.commands.registerCommand(
    'snipshare.searchSnippet',
    async () => {
      console.log('🔍 [Search] starting');
      let editor = vscode.window.activeTextEditor;

      const query = await vscode.window.showInputBox({
        prompt: '🔍 Search for a snippet (by description)'
      });
      if (!query) return;

      let results;
      try {
        results = await storage.search(query);
      } catch (err) {
        console.error('❌ storage.search failed:', err);
        return vscode.window.showErrorMessage('Could not fetch snippets');
      }

      if (results.length === 0) {
        return vscode.window.showInformationMessage(`No snippets matching "${query}"`);
      }

      const pick = await vscode.window.showQuickPick(
        results.map(g => ({ label: g.description, id: g.id })),
        { placeHolder: 'Select snippet to insert' }
      );
      if (!pick) return;

      // Use a different variable name for the metadata
      const meta = results.find(g => g.id === pick.id);
      console.log(`🔍 [Search] meta.id=${meta.id}`);

      // Fetch the full gist with content
      let full;
      try {
        full = await getGist(meta.id);
      } catch (err) {
        console.error('❌ getGist failed:', err);
        return vscode.window.showErrorMessage('Could not load snippet content');
      }

      // Grab the first file’s content
      const filename = Object.keys(full.files)[0];
      const content = full.files[filename].content;
      console.log(`🔍 [Search] content length=${content.length}`);

      // Restore focus
      if (editor) {
        editor = await vscode.window.showTextDocument(editor.document);
      } else {
        const doc = await vscode.workspace.openTextDocument({ content: '', language: 'plaintext' });
        editor = await vscode.window.showTextDocument(doc);
      }

      // Attempt insertion
      try {
        await editor.insertSnippet(new vscode.SnippetString(content));
        console.log('✔️ insertSnippet succeeded');
      } catch (err) {
        console.warn('❗ insertSnippet failed, using edit():', err);
        await editor.edit(editBuilder => {
          editBuilder.insert(editor.selection.active, content);
        });
        console.log('✔️ fallback edit() succeeded');
      }

      vscode.window.showInformationMessage(`Inserted snippet "${meta.description}"`);
    }
  );
  context.subscriptions.push(searchCmd);

  // Create Snippet
  const createCmd = vscode.commands.registerCommand(
    'snipshare.createSnippet',
    async () => {
      debugChannel.appendLine('➕ [Create] starting');

      // 1) Title
      const title = await vscode.window.showInputBox({ prompt: '📝 Snippet title' });
      debugChannel.appendLine(`➕ [Create] title="${title}"`);
      if (!title) return;

      // 2) Content
      const editor = vscode.window.activeTextEditor;
      let content = '';
      if (editor && !editor.selection.isEmpty) {
        content = editor.document.getText(editor.selection);
        debugChannel.appendLine(`➕ [Create] using selection (length=${content.length})`);
      } else {
        const input = await vscode.window.showInputBox({ prompt: '💾 Snippet content' });
        content = input || '';
        debugChannel.appendLine(`➕ [Create] input content length=${content.length}`);
        if (!content) return;
      }

      vscode.window.showInformationMessage(`(DEBUG) saving snippet with content: ${content.slice(0,40)}…`);

      let snippet;
      try {
        snippet = await storage.create({ description: title, files: { 'snippet.txt': { content } } });
        debugChannel.appendLine(`✔️ storage.create succeeded, id=${snippet.id}`);
      } catch (err) {
        debugChannel.appendLine(`❌ storage.create failed: ${err}`);
        return vscode.window.showErrorMessage('Could not create snippet');
      }

      vscode.window.showInformationMessage(
        `Created snippet "${title}" (Gist ID: ${snippet.id})`
      );
    }
  );
  context.subscriptions.push(createCmd);

  debugChannel.appendLine('✅ registerCommands() complete — commands are bound');
}

module.exports = { registerCommands };
