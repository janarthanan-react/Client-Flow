// backend/index.js
// Universal Express entrypoint for Vercel deployment

let appInstance = null;

function getApp() {
  if (appInstance) return appInstance;

  let appModule;
  try {
    appModule = require('./dist/app');
  } catch (distErr) {
    try {
      require('ts-node/register/transpile-only');
      appModule = require('./src/app');
    } catch (tsErr) {
      console.error('Failed to load Express app from dist and src:', { distErr, tsErr });
      throw distErr;
    }
  }

  const app = appModule.createApp ? appModule.createApp() : (appModule.default || appModule);
  appInstance = app;
  return appInstance;
}

const handler = (req, res) => {
  const app = getApp();
  return app(req, res);
};

const proxyExport = new Proxy(handler, {
  get(target, prop) {
    if (prop === 'default') return proxyExport;
    if (prop in target) return target[prop];
    const app = getApp();
    const val = app[prop];
    return typeof val === 'function' ? val.bind(app) : val;
  },
});

module.exports = proxyExport;
module.exports.default = proxyExport;
module.exports.getApp = getApp;
