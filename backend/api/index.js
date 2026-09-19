// backend/api/index.js
// Serverless entrypoint for Vercel deployment of ClientFlow API

let appInstance = null;

function getApp() {
  if (appInstance) return appInstance;

  let appModule;
  try {
    // 1. Try loading compiled dist/app (standard production build output)
    appModule = require('../dist/app');
  } catch (distErr) {
    try {
      // 2. Fallback: load TypeScript src/app directly via ts-node transpile-only
      require('ts-node/register/transpile-only');
      appModule = require('../src/app');
    } catch (tsErr) {
      console.error('Failed to load Express app from dist and src:', { distErr, tsErr });
      throw distErr;
    }
  }

  const app = appModule.createApp ? appModule.createApp() : (appModule.default || appModule);
  appInstance = app;
  return appInstance;
}

// Serverless function request handler for Vercel
const handler = (req, res) => {
  const app = getApp();
  return app(req, res);
};

// Support both CommonJS and ES Module interop
module.exports = handler;
module.exports.default = handler;
