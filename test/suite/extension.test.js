// test/suite/extension.test.js
const assert = require('chai').assert;
const vscode = require('vscode');

suite('SnipShare Extension Tests', function () {
  this.timeout(60 * 1000);

  test('Extension activates without error', async () => {
    // Replace with your extension id from package.json: publisher.name
    const ext = vscode.extensions.getExtension('suryansh-it.snipshare-vscode-plugin');
    assert.ok(ext, 'Extension not found in registry');

    // Activate should not throw
    await ext.activate();
    assert.isTrue(ext.isActive, 'Extension failed to activate');
  });

  test('Core commands are registered (contributes.commands)', async () => {
    // Get all registered command ids (may be many); ensure ours are present
    const commands = await vscode.commands.getCommands(true);

    // These are the important commands that must be present
    const expected = [
      'snipshare.test',
      'snipshare.searchSnippet',
      'snipshare.createSnippet',
      'snipshare.help'
    ];

    for (const cmd of expected) {
      assert.include(commands, cmd, `Command "${cmd}" is not registered`);
    }
  });

  test('snipshare.test executes without throwing', async () => {
    // This is a safe command that your extension registers and should not perform network calls
    let thrown = false;
    try {
      await vscode.commands.executeCommand('snipshare.test');
    } catch (err) {
      thrown = true;
      console.error('snipshare.test threw:', err);
    }
    assert.isFalse(thrown, 'snipshare.test command threw an error');
  });

  test('Activation.. gives useful telemetry if it fails', async () => {
    // If you want tests to output the extension host logs on failure for diagnostics,
    // include a dummy fail check that prints helpful debug info (optional).
    const ext = vscode.extensions.getExtension('suryansh-it.snipshare-vscode-plugin');
    assert.ok(ext, 'Extension missing');
    // If extension didn't become active earlier, try again and surface reason:
    try {
      await ext.activate();
    } catch (e) {
      // bubble useful info
      const message = `Activation failed: ${e && e.message ? e.message : e}`;
      assert.fail(message);
    }
  });
});
