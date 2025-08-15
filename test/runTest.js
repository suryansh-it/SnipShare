// test/runTest.js
const path = require('path');
const { runTests } = require('@vscode/test-electron');

async function main() {
  try {
    // Path to the extension test runner (Mocha tests)
    const extensionDevelopmentPath = path.resolve(__dirname, '..'); // project root
    const extensionTestsPath = path.resolve(__dirname, 'suite'); // test suite folder

    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [
        // Use a temporary workspace (no folder) so tests are deterministic
        '--disable-extensions'
      ]
    });
  } catch (err) {
    console.error('Failed to run tests:', err);
    process.exit(1);
  }
}

main();
