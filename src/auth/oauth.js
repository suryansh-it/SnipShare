const vscode = require('vscode');
const fetch = require('node-fetch');
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;


/**
 * Initiate GitHub Device Flow
 * @returns {Promise<{device_code:string, user_code:string, verification_uri:string, interval:number}>}
 */
async function startDeviceFlow(clientId) {
  const res = await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, scope: 'gist' })
  });
  if (!res.ok) throw new Error(`Device flow error: ${res.status}`);
  return res.json();
}

/**
 * Poll for OAuth token
 */
async function pollForToken(clientId, deviceCode, interval) {
  while (true) {
    await new Promise(r => setTimeout(r, interval * 1000));
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
      })
    });
    const data = await res.json();
    if (data.error === 'authorization_pending') continue;
    if (data.error) throw new Error(data.error);
    return data.access_token;
  }
}

/**
 * Run OAuth flow and store token
 */
async function authenticate(context) {
  const clientId = GITHUB_CLIENT_ID;
  const { device_code, user_code, verification_uri, interval } = await startDeviceFlow(clientId);

  // Prompt user to verify
  vscode.window.showInformationMessage(`Open ${verification_uri} and enter code ${user_code}`);

  const token = await pollForToken(clientId, device_code, interval);
  await context.globalState.update('githubToken', token);
  vscode.window.showInformationMessage('🔒 GitHub authenticated!');
}

module.exports = { authenticate };