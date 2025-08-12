// // src/commands.js

// const vscode = require('vscode');
// const storage = require('./services/storageManager');
// const { getGist } = require('./services/gistService');
// const debugChannel = vscode.window.createOutputChannel('SnipShare Debug');

// const path = require('path');
// const fs = require('fs');

// async function registerCommands(context) {
//   debugChannel.appendLine('➡️ registerCommands() start');



// const helpCmd = vscode.commands.registerCommand('snipshare.help', async () => {
//   const readmePath = path.join(__dirname, '..', 'README.md');
//   if (!fs.existsSync(readmePath)) {
//     return vscode.window.showErrorMessage('README.md not found in extension folder');
//   }
//   const doc = await vscode.workspace.openTextDocument(readmePath);
//   await vscode.window.showTextDocument(doc, { preview: false });
// });
// context.subscriptions.push(helpCmd);


//   // Test Command
//   const testCmd = vscode.commands.registerCommand('snipshare.test', () => {
//     vscode.window.showInformationMessage('✅ SnipShare Test command works');
//     debugChannel.appendLine('✔️ Test command invoked');
//   });
//   context.subscriptions.push(testCmd);


// // register the Setup command 
// const setupCmd = vscode.commands.registerCommand('snipshare.setup', async () => {
//   const pick = await vscode.window.showQuickPick(
//     ['Paste Personal Access Token (PAT)', 'Use Device Flow (GitHub OAuth)'],
//     { placeHolder: 'Choose authentication method for SnipShare' }
//   );
//   if (!pick) return;

//   if (pick === 'Paste Personal Access Token (PAT)') {
//     const input = await vscode.window.showInputBox({
//       prompt: 'Paste your GitHub Personal Access Token (needs gist scope)',
//       ignoreFocusOut: true,
//       password: true
//     });
//     if (!input) return;
//     // Save token in both user settings and globalState
//     await vscode.workspace.getConfiguration('snipshare').update('githubToken', input, vscode.ConfigurationTarget.Global);
//     await context.globalState.update('githubToken', input);
//     vscode.window.showInformationMessage('SnipShare: Token saved — you are authenticated.');
//   } else {
//     // Device flow - requires client id env var or prior setup
//     try {
//       await authenticate(context);
//     } catch (err) {
//       vscode.window.showErrorMessage('Device Flow failed: ' + (err.message || err));
//     }
//   }
// });
// context.subscriptions.push(setupCmd);



//  // 2) Search Snippet
//   const searchCmd = vscode.commands.registerCommand(
//   'snipshare.searchSnippet',
//   async () => {
//     console.log('🔍 [Search] starting');
//     let editor = vscode.window.activeTextEditor;

//     // 1) If user has selected text, use that as the query
//     let prefill = '';
//     if (editor && !editor.selection.isEmpty) {
//       prefill = editor.document.getText(editor.selection);
//       console.log(`🔍 [Search] using selected text: "${prefill}"`);
//     }

//     // 2) If we got something, skip the prompt; else ask
//     let query = prefill;
//     if (!query) {
//       query = await vscode.window.showInputBox({
//         prompt: '🔍 Search for a snippet (by description)'
//       });
//     }
//     if (!query) {
//       console.log('🔍 [Search] canceled');
//       return;
//     }

//       let results;
//       try {
//         results = await storage.search(query);
//       } catch (err) {
//         console.error('❌ storage.search failed:', err);
//         return vscode.window.showErrorMessage('Could not fetch snippets');
//       }

//       if (results.length === 0) {
//         return vscode.window.showInformationMessage(`No snippets matching "${query}"`);
//       }

//       const pick = await vscode.window.showQuickPick(
//         results.map(g => ({ label: g.description, id: g.id })),
//         { placeHolder: 'Select snippet to insert' }
//       );
//       if (!pick) return;

//       // Use a different variable name for the metadata
//       const meta = results.find(g => g.id === pick.id);
//       console.log(`🔍 [Search] meta.id=${meta.id}`);

//       // Fetch the full gist with content
//       let full;
//       try {
//         full = await getGist(meta.id);
//       } catch (err) {
//         console.error('❌ getGist failed:', err);
//         return vscode.window.showErrorMessage('Could not load snippet content');
//       }

//       // Grab the first file’s content
//       const filename = Object.keys(full.files)[0];
//       const content = full.files[filename].content;
//       console.log(`🔍 [Search] content length=${content.length}`);

//       // Restore focus
//       if (editor) {
//         editor = await vscode.window.showTextDocument(editor.document);
//       } else {
//         const doc = await vscode.workspace.openTextDocument({ content: '', language: 'plaintext' });
//         editor = await vscode.window.showTextDocument(doc);
//       }

//       // Attempt insertion
//       try {
//         await editor.insertSnippet(new vscode.SnippetString(content));
//         console.log('✔️ insertSnippet succeeded');
//       } catch (err) {
//         console.warn('❗ insertSnippet failed, using edit():', err);
//         await editor.edit(editBuilder => {
//           editBuilder.insert(editor.selection.active, content);
//         });
//         console.log('✔️ fallback edit() succeeded');
//       }

//       vscode.window.showInformationMessage(`Inserted snippet "${meta.description}"`);
//     }
//   );
//   context.subscriptions.push(searchCmd);

//   // Create Snippet
//    const createCmd = vscode.commands.registerCommand(
//     'snipshare.createSnippet',
//     async () => {
//       console.log('➕ [Create] starting');

//       // 1) Title
//       const title = await vscode.window.showInputBox({ prompt: '📝 Snippet title' });
//       if (!title) return;

//       // 2) Grab content: selection or whole document
//       const editor = vscode.window.activeTextEditor;
//       let content = '';
//       if (editor) {
//         if (!editor.selection.isEmpty) {
//           // use only the selected text
//           content = editor.document.getText(editor.selection);
//           console.log(`➕ [Create] using selected text length=${content.length}`);
//         } else {
//           // use the entire document
//           content = editor.document.getText();
//           console.log(`➕ [Create] using entire document length=${content.length}`);
//         }
//       } else {
//         return vscode.window.showErrorMessage('No active editor to capture content from');
//       }

//       // 3) Create the snippet
//       let snippet;
//       try {
//         snippet = await storage.create({
//           description: title,
//           files: { 'snippet.txt': { content } }
//         });
//         console.log(`✔️ storage.create succeeded, id=${snippet.id}`);
//       } catch (err) {
//         console.error('❌ storage.create failed:', err);
//         return vscode.window.showErrorMessage('Could not create snippet');
//       }

//       vscode.window.showInformationMessage(
//         `Created snippet "${title}" (Gist ID: ${snippet.id})`
//       );
//     }
//   );
//   context.subscriptions.push(createCmd);

//   debugChannel.appendLine('✅ registerCommands() complete — commands are bound');
// }

// module.exports = { registerCommands };


// src/commands.js

const vscode = require('vscode');
const storage = require('./services/storageManager');
const { getGist, createGist } = require('./services/gistService');
const debugChannel = vscode.window.createOutputChannel('SnipShare Debug');
const path = require('path');
const fs = require('fs');

async function registerCommands(context) {
  debugChannel.appendLine('➡️ registerCommands() start');

  // initialize memento cache (if your storage expects it)
  try {
    if (typeof storage.init === 'function') storage.init(context);
  } catch (e) {
    console.error('⚠️ storage.init failed', e);
  }

  // Setup command: only PAT (no device flow)
  const setupCmd = vscode.commands.registerCommand('snipshare.setup', async () => {
    const input = await vscode.window.showInputBox({
      prompt: 'Paste your GitHub Personal Access Token (PAT) with gist scope',
      ignoreFocusOut: true,
      password: true
    });
    if (!input) return;
    await vscode.workspace.getConfiguration('snipshare').update('githubToken', input, vscode.ConfigurationTarget.Global);
    await context.globalState.update('githubToken', input);
    vscode.window.showInformationMessage('SnipShare: Token saved — you are authenticated.');
  });
  context.subscriptions.push(setupCmd);

  // Help command (open README)
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

  // Search Snippet (uses storage.search)
  const searchCmd = vscode.commands.registerCommand('snipshare.searchSnippet', async () => {
    debugChannel.appendLine('🔍 [Search] starting');
    let editor = vscode.window.activeTextEditor;

    // 1) Pre-fill from selection
    let prefill = '';
    if (editor && !editor.selection.isEmpty) {
      prefill = editor.document.getText(editor.selection);
      debugChannel.appendLine(`🔍 [Search] using selected text: "${prefill}"`);
    }

    // 2) Prompt if no selection
    const query = prefill || await vscode.window.showInputBox({
      prompt: '🔍 Search for a snippet (by description)'
    });
    if (!query) {
      debugChannel.appendLine('🔍 [Search] canceled');
      return;
    }

    let results;
    try {
      results = await storage.search(query);
    } catch (err) {
      console.error('❌ storage.search failed:', err);
      return vscode.window.showErrorMessage('Could not fetch snippets');
    }

    debugChannel.appendLine(`🔍 [Search] found ${results.length} matches`);
    if (results.length === 0) {
      return vscode.window.showInformationMessage(`No snippets matching "${query}"`);
    }

    const pick = await vscode.window.showQuickPick(
      results.map(g => ({ label: g.description || '(no title)', id: g.id })),
      { placeHolder: 'Select snippet to insert' }
    );
    if (!pick) return;

    const meta = results.find(g => g.id === pick.id);

    // Fetch the full gist
    let full;
    try {
      full = await getGist(meta.id);
    } catch (err) {
      console.error('❌ getGist failed:', err);
      return vscode.window.showErrorMessage('Could not load snippet content');
    }

    // Grab first file content
    const filename = Object.keys(full.files)[0];
    const content = full.files[filename].content;

    // Restore focus to original editor or open untitled
    if (editor) {
      editor = await vscode.window.showTextDocument(editor.document, editor.viewColumn);
    } else {
      const doc = await vscode.workspace.openTextDocument({ content: '', language: 'plaintext' });
      editor = await vscode.window.showTextDocument(doc);
    }

    // Try insertion
    try {
      await editor.insertSnippet(new vscode.SnippetString(content));
      debugChannel.appendLine('✔️ insertSnippet succeeded');
    } catch (err) {
      console.warn('❗ insertSnippet failed, using edit():', err);
      await editor.edit(editBuilder => {
        editBuilder.insert(editor.selection.active, content);
      });
      debugChannel.appendLine('✔️ fallback edit() succeeded');
    }

    vscode.window.showInformationMessage(`Inserted snippet "${meta.description || filename}"`);
  });
  context.subscriptions.push(searchCmd);

  // Create Snippet (capture selection or whole doc)
  const createCmd = vscode.commands.registerCommand('snipshare.createSnippet', async () => {
    debugChannel.appendLine('➕ [Create] starting');

    const title = await vscode.window.showInputBox({ prompt: '📝 Snippet title' });
    if (!title) return;

    const editor = vscode.window.activeTextEditor;
    let content = '';
    if (editor) {
      if (!editor.selection.isEmpty) {
        content = editor.document.getText(editor.selection);
        debugChannel.appendLine(`➕ [Create] using selected text length=${content.length}`);
      } else {
        content = editor.document.getText();
        debugChannel.appendLine(`➕ [Create] using entire document length=${content.length}`);
      }
    } else {
      return vscode.window.showErrorMessage('No active editor to capture content from');
    }

    let snippet;
    try {
      snippet = await storage.create({ description: title, files: { 'snippet.txt': { content } } });
      debugChannel.appendLine(`✔️ storage.create succeeded, id=${snippet.id}`);
    } catch (err) {
      console.error('❌ storage.create failed:', err);
      return vscode.window.showErrorMessage('Could not create snippet');
    }

    vscode.window.showInformationMessage(`Created snippet "${title}" (Gist ID: ${snippet.id})`);
  });
  context.subscriptions.push(createCmd);

  // Share Snippet command
  const shareCmd = vscode.commands.registerCommand('snipshare.shareSnippet', async () => {
    debugChannel.appendLine('🔗 [Share] starting');

    // List snippets
    let all;
    try {
      all = await storage.list();
    } catch (err) {
      console.error('❌ storage.list failed:', err);
      return vscode.window.showErrorMessage('Could not fetch snippets for sharing');
    }
    if (!all || all.length === 0) {
      return vscode.window.showInformationMessage('No snippets to share');
    }

    const pick = await vscode.window.showQuickPick(
      all.map(g => ({ label: g.description || '(no title)', id: g.id })),
      { placeHolder: 'Select a snippet to share' }
    );
    if (!pick) return;

    // Fetch full gist
    let full;
    try {
      full = await getGist(pick.id);
    } catch (err) {
      console.error('❌ getGist failed:', err);
      return vscode.window.showErrorMessage('Could not load snippet for sharing');
    }

    const htmlUrl = full.html_url;
    const firstFileName = Object.keys(full.files)[0];
    const rawUrl = full.files[firstFileName].raw_url;
    const content = full.files[firstFileName].content;
    const md = '```' + (firstFileName.split('.').pop() || '') + '\n' + content + '\n```';

    // Share options
    const choice = await vscode.window.showQuickPick([
      { label: 'Copy Gist link', id: 'copy-link' },
      { label: 'Copy Raw URL', id: 'copy-raw' },
      { label: 'Copy Markdown', id: 'copy-md' },
      { label: 'Open in Browser', id: 'open' }
    ], { placeHolder: 'How would you like to share?' });
    if (!choice) return;

    if (choice.id === 'copy-link') {
      await vscode.env.clipboard.writeText(htmlUrl);
      vscode.window.showInformationMessage('Gist link copied to clipboard');
    } else if (choice.id === 'copy-raw') {
      await vscode.env.clipboard.writeText(rawUrl);
      vscode.window.showInformationMessage('Raw URL copied to clipboard');
    } else if (choice.id === 'copy-md') {
      await vscode.env.clipboard.writeText(md);
      vscode.window.showInformationMessage('Markdown copied to clipboard');
    } else if (choice.id === 'open') {
      await vscode.env.openExternal(vscode.Uri.parse(htmlUrl));
    }
  });
  context.subscriptions.push(shareCmd);

  // Create Pack (bundle multiple snippets into one Gist)
  const createPackCmd = vscode.commands.registerCommand('snipshare.createPack', async () => {
    debugChannel.appendLine('📦 [Create Pack] starting');

    let all;
    try {
      all = await storage.list();
    } catch (err) {
      console.error('❌ storage.list failed:', err);
      return vscode.window.showErrorMessage('Could not fetch snippets to create pack');
    }
    if (!all || all.length === 0) return vscode.window.showInformationMessage('No snippets available to pack');

    const picks = await vscode.window.showQuickPick(
      all.map(g => ({ label: g.description || '(no title)', id: g.id })),
      { canPickMany: true, placeHolder: 'Select snippets to include in pack' }
    );
    if (!picks || picks.length === 0) return;

    const packName = await vscode.window.showInputBox({ prompt: 'Pack name' });
    if (!packName) return;

    const pubChoice = await vscode.window.showQuickPick(['Private (secret) Gist', 'Public Gist'], { placeHolder: 'Create pack as:' });
    const isPublic = pubChoice === 'Public Gist';

    // Build files object
    const files = {};
    const manifest = { snipshare_pack_name: packName, version: 1, snippets: [] };

    for (const p of picks) {
      let full;
      try {
        full = await getGist(p.id);
      } catch (err) {
        console.warn(`❌ getGist ${p.id} failed:`, err);
        continue;
      }
      const fname = `${p.label.replace(/\s+/g, '_') || 'snippet'}_${p.id.slice(0,6)}.txt`;
      const firstFileName = Object.keys(full.files)[0];
      files[fname] = { content: full.files[firstFileName].content };
      manifest.snippets.push({ title: p.label, file: fname });
    }

    files['manifest.json'] = { content: JSON.stringify(manifest, null, 2) };

    // Create the pack gist
    let gist;
    try {
      gist = await createGist({ description: `SnipShare pack: ${packName}`, files, public: isPublic });
    } catch (err) {
      console.error('❌ createGist (pack) failed:', err);
      return vscode.window.showErrorMessage('Could not create pack gist');
    }

    await vscode.env.clipboard.writeText(gist.html_url);
    vscode.window.showInformationMessage(`Pack created and link copied: ${gist.html_url}`);
  });
  context.subscriptions.push(createPackCmd);

  // Import Pack (from Gist URL) — creates new gists for each snippet via storage.create
  const importPackCmd = vscode.commands.registerCommand('snipshare.importPack', async () => {
    debugChannel.appendLine('📥 [Import Pack] starting');

    const source = await vscode.window.showQuickPick(['From Gist URL', 'From local JSON file'], { placeHolder: 'Import pack from:' });
    if (!source) return;

    let manifestData;
    if (source === 'From Gist URL') {
      const url = await vscode.window.showInputBox({ prompt: 'Enter Gist URL (https://gist.github.com/... or https://api.github.com/gists/<id>)' });
      if (!url) return;
      // Extract gist id
      const m = url.match(/([0-9a-f]{20,})$/i) || url.match(/gists\/([0-9a-f]{20,})/i);
      const gistId = m ? m[1] : null;
      if (!gistId) return vscode.window.showErrorMessage('Could not parse Gist ID from URL');

      let full;
      try {
        full = await getGist(gistId);
      } catch (err) {
        console.error('❌ getGist for import failed:', err);
        return vscode.window.showErrorMessage('Could not fetch the pack gist');
      }

      if (!full.files['manifest.json']) return vscode.window.showErrorMessage('manifest.json not found in the pack');
      manifestData = JSON.parse(full.files['manifest.json'].content);
      // manifest lists snippet files; import them
      for (const item of manifestData.snippets || []) {
        const fname = item.file;
        const file = full.files[fname];
        if (!file) {
          console.warn(`file ${fname} not present in gist`);
          continue;
        }
        // Create a new gist per snippet (asks network)
        try {
          await storage.create({ description: item.title || fname, files: { [fname]: { content: file.content } } });
        } catch (err) {
          console.error('❌ storage.create failed for import:', err);
        }
      }
      vscode.window.showInformationMessage(`Imported pack "${manifestData.snipshare_pack_name}"`);
    } else {
      // From local file
      const uris = await vscode.window.showOpenDialog({ filters: { 'JSON': ['json'] }, canSelectMany: false });
      if (!uris || uris.length === 0) return;
      const content = fs.readFileSync(uris[0].fsPath, 'utf8');
      manifestData = JSON.parse(content);
      for (const item of manifestData.snippets || []) {
        // If manifest includes 'content' (embedded), use it, else skip
        if (item.content) {
          try {
            await storage.create({ description: item.title || item.file, files: { [item.file]: { content: item.content } } });
          } catch (err) { console.error('❌ storage.create failed for import:', err); }
        }
      }
      vscode.window.showInformationMessage(`Imported pack "${manifestData.snipshare_pack_name}" from file`);
    }
  });
  context.subscriptions.push(importPackCmd);

  debugChannel.appendLine('✅ registerCommands() complete — commands are bound');
}

module.exports = { registerCommands };
