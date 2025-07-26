// src/auth/oauth.js (CommonJS)

const dotenv = require('dotenv');
dotenv.config();

const vscode = require('vscode');
const fetch = require('node-fetch');

/** Device flow start */
async function startDeviceFlow(clientId) {
  const body = `client_id=${clientId}&scope=gist`;
  const res = await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!res.ok) throw new Error(`Device flow error: ${res.status}`);
  return res.json();
}

/** Poll for token */
async function pollForToken(clientId, deviceCode, interval) {
  const url = 'https://github.com/login/oauth/access_token';
  while (true) {
    await new Promise(r => setTimeout(r, interval * 1000));
    const body = `client_id=${clientId}&device_code=${deviceCode}&grant_type=urn:ietf:params:oauth:grant-type:device_code`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json'
      },
      body
    });
    const data = await res.json();
    if (data.error === 'authorization_pending') continue;
    if (data.error) throw new Error(data.error);
    return data.access_token;
  }
}

/** Run the device flow */
async function authenticate(context) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  console.log('🔑 Using CLIENT_ID =', clientId);
  const { device_code, user_code, verification_uri, interval } = await startDeviceFlow(clientId);

  vscode.window.showInformationMessage(`Open ${verification_uri} and enter code ${user_code}`);

  const token = await pollForToken(clientId, device_code, interval);
  await context.globalState.update('githubToken', token);
  vscode.window.showInformationMessage('🔒 GitHub authenticated!');
}

module.exports = { authenticate };
