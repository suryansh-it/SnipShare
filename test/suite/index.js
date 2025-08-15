// test/suite/index.js
const path = require('path');
const globModule = require('glob');
const Mocha = require('mocha');

const mocha = new Mocha({
 ui: 'tdd', 
  color: true,
  timeout: 60_000
});

const testsRoot = path.resolve(__dirname);

/**
 * Cross-version helper to list matching files using `glob`.
 * Supports older glob callback API and newer glob/ globSync exports.
 */
function listTestFiles(pattern, options, cb) {
  // globModule could be:
  // - a function (older versions)
  // - an object with methods (newer versions: { glob, globSync, globStream, ... })
  if (typeof globModule === 'function') {
    // legacy: glob(pattern, options, cb)
    return globModule(pattern, options, cb);
  }

  if (typeof globModule.glob === 'function') {
    // new API: globModule.glob(pattern, options).then(...) OR callback
    // try callback form if available
    try {
      const res = globModule.glob(pattern, options);
      // If it returned a Promise-like (async), use .then
      if (res && typeof res.then === 'function') {
        res.then(files => cb(null, files)).catch(cb);
      } else {
        // If it's sync-like and returns array
        cb(null, res);
      }
    } catch (err) {
      // fallback to sync variants
      if (typeof globModule.globSync === 'function') {
        try {
          const files = globModule.globSync(pattern, options);
          cb(null, files);
        } catch (e) {
          cb(e);
        }
      } else {
        cb(err);
      }
    }
    return;
  }

  // fallback to sync APIs if present
  if (typeof globModule.sync === 'function') {
    try {
      const files = globModule.sync(pattern, options);
      return cb(null, files);
    } catch (e) {
      return cb(e);
    }
  }

  if (typeof globModule.globSync === 'function') {
    try {
      const files = globModule.globSync(pattern, options);
      return cb(null, files);
    } catch (e) {
      return cb(e);
    }
  }

  cb(new Error('Unable to use glob: incompatible glob package API'));
}

function run() {
  return new Promise((resolve, reject) => {
    listTestFiles('**/*.test.js', { cwd: testsRoot }, (err, files) => {
      if (err) return reject(err);
      files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));
      try {
        mocha.run(failures => {
          if (failures > 0) {
            reject(new Error(`${failures} test(s) failed.`));
          } else {
            resolve();
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  });
}

module.exports = { run };
