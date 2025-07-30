// src/services/gistService.js
const vscode = require('vscode');
const fetch = require('node-fetch');

const API_BASE = 'https://api.github.com';

/**
 * Grab the PAT from VS Code settings each time.
 */
function getToken() {
  const token = vscode.workspace
    .getConfiguration('snipshare')
    .get('githubToken');
  if (!token) throw new Error('snipshare.githubToken is not set');
  return token;
}

/**
 * List the user’s gists.
 * @returns {Promise<Array>}
 */
async function listGists() {
  const token = getToken();
  const res = await fetch(`${API_BASE}/gists`, {
    headers: { Authorization: `token ${token}` }
  });
  if (!res.ok) throw new Error(`GitHub API list error ${res.status}`);
  return res.json();
}

/**
 * Create a new Gist.
 * @param {{description: string, files: Record<string,{content:string}>}} body
 * @returns {Promise<Object>}
 */
async function createGist(body) {
  const token = getToken();
  const res = await fetch(`${API_BASE}/gists`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `token ${token}`
    },
    body: JSON.stringify({ ...body, public: false })
  });
  if (!res.ok) throw new Error(`GitHub API create error ${res.status}`);
  return res.json();
}

module.exports = { listGists, createGist };
