// src/commands.js

const vscode = require('vscode');
const storage = require('./services/storageManager');
const { getGist } = require('./services/gistService');
const debugChannel = vscode.window.createOutputChannel('SnipShare Debug');

const path = require('path');
const fs = require('fs');

async function registerCommands(context) {
  debugChannel.appendLine('➡️ registerCommands() start');



const helpCmd = vscode.commands.registerCommand('snipshare.help', async () => {
  const readmePath = path.join(__dirname, '..', 'README.md');
  if (!fs.existsSync(readmePath)) {
    return vscode.window.showErrorMessage('README.md not found in extension folder');
  }
  const doc = await vscode.workspace.openTextDocument(readmePath);
  await vscode.window.showTextDocument(doc, { preview: false });
});
context.subscriptions.push(helpCmd);


  // Test Command
  const testCmd = vscode.commands.registerCommand('snipshare.test', () => {
    vscode.window.showInformationMessage('✅ SnipShare Test command works');
    debugChannel.appendLine('✔️ Test command invoked');
  });
  context.subscriptions.push(testCmd);


// register the Setup command 
const setupCmd = vscode.commands.registerCommand('snipshare.setup', async () => {
  const pick = await vscode.window.showQuickPick(
    ['Paste Personal Access Token (PAT)', 'Use Device Flow (GitHub OAuth)'],
    { placeHolder: 'Choose authentication method for SnipShare' }
  );
  if (!pick) return;

  if (pick === 'Paste Personal Access Token (PAT)') {
    const input = await vscode.window.showInputBox({
      prompt: 'Paste your GitHub Personal Access Token (needs gist scope)',
      ignoreFocusOut: true,
      password: true
    });
    if (!input) return;
    // Save token in both user settings and globalState
    await vscode.workspace.getConfiguration('snipshare').update('githubToken', input, vscode.ConfigurationTarget.Global);
    await context.globalState.update('githubToken', input);
    vscode.window.showInformationMessage('SnipShare: Token saved — you are authenticated.');
  } else {
    // Device flow - requires client id env var or prior setup
    try {
      await authenticate(context);
    } catch (err) {
      vscode.window.showErrorMessage('Device Flow failed: ' + (err.message || err));
    }
  }
});
context.subscriptions.push(setupCmd);



 // 2) Search Snippet
  const searchCmd = vscode.commands.registerCommand(
  'snipshare.searchSnippet',
  async () => {
    console.log('🔍 [Search] starting');
    let editor = vscode.window.activeTextEditor;

    // 1) If user has selected text, use that as the query
    let prefill = '';
    if (editor && !editor.selection.isEmpty) {
      prefill = editor.document.getText(editor.selection);
      console.log(`🔍 [Search] using selected text: "${prefill}"`);
    }

    // 2) If we got something, skip the prompt; else ask
    let query = prefill;
    if (!query) {
      query = await vscode.window.showInputBox({
        prompt: '🔍 Search for a snippet (by description)'
      });
    }
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
      console.log('➕ [Create] starting');

      // 1) Title
      const title = await vscode.window.showInputBox({ prompt: '📝 Snippet title' });
      if (!title) return;

      // 2) Grab content: selection or whole document
      const editor = vscode.window.activeTextEditor;
      let content = '';
      if (editor) {
        if (!editor.selection.isEmpty) {
          // use only the selected text
          content = editor.document.getText(editor.selection);
          console.log(`➕ [Create] using selected text length=${content.length}`);
        } else {
          // use the entire document
          content = editor.document.getText();
          console.log(`➕ [Create] using entire document length=${content.length}`);
        }
      } else {
        return vscode.window.showErrorMessage('No active editor to capture content from');
      }

      // 3) Create the snippet
      let snippet;
      try {
        snippet = await storage.create({
          description: title,
          files: { 'snippet.txt': { content } }
        });
        console.log(`✔️ storage.create succeeded, id=${snippet.id}`);
      } catch (err) {
        console.error('❌ storage.create failed:', err);
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
