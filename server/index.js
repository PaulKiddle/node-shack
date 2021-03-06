const getenv = require('getenv');
const express = require('express');
const cookieParser = require('cookie-parser');
const ReactDOMServer = require('react-dom/server');
const ST = require("stream-template");
const React = require('react');
const NODE_ENV = getenv('NODE_ENV', 'production');
const FALLBACKS = getenv('FALLBACKS', '');

// Disable env fallbacks before requiring project files
if (NODE_ENV !== 'development' && !FALLBACKS) {
  getenv.disableFallbacks();
}

// Inclue project files
const auth = require('./auth');
const router = require('./router');

// Set up app
const app = express();
const PORT = getenv('PORT', 3000);

// Configure parsers
app.use(cookieParser())
app.use((req, res, next) => {
  res.state = {};
  next();
})

// Deal with authentication
app.use(auth);
app.use(router);

// Serve static files
if (NODE_ENV === 'development') {
  app.use(require('./dev').static());
} else {
  app.use(express.static('dist'));
}

app.use(async (req, res, next) => {
  try {
    if(/*!req.found || */!req.accepts('text/html')) {
      return next();
    }

    if(res.hasHeader('location')) {
      res.sendStatus(302);
      return;
    }

    const App =
      (NODE_ENV === 'development') ?
        require(await require('./dev').server()).default
      :
        require('../dist/main.node.js').default
      ;

    const app = React.createElement(App, {
      state: res.state
    });

    const { vapidKeys } = require('./push');

    const envs = {
      VAPID_PUBLIC: vapidKeys.public,
      BASE_URL: getenv('BASE_URL', 'http://localhost:3000')
    };

    ST`<!doctype HTML>
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta charset="utf-8">
        <link rel="manifest" href="/manifest.json">
        <style type="text/css">
        ${require('fs').createReadStream(require.resolve('./styles.css'))}
        </style>
        <script>
        window.__INITIAL_STATE__ = ${JSON.stringify(res.state)};
        const envs = ${JSON.stringify(envs)};
        window.getenv = key => envs[key];
        </script>
      </head>
      <body>
        <div id="root">${ReactDOMServer.renderToNodeStream(app)}</div>
      </body>
      <script src="main.js"></script>
    </html>
    `.pipe(res);
  } catch(e) {
    next(e);
  }
});

app.use((req, res, next) => {
  if(req.found) {
    if(res.hasHeader('location')) {
      res.sendStatus(302);
      return;
    }

    const state = res.state;
    if(!state.message) {
      state.message = null;
    }

    res.json(state);
  } else {
    next();
  }
});

app.use((err, req, res, next) => {
  if(req.accepts('application/json')) {
    res.json({ message: err.toString() })
  } else {
    next(e);
  }
});

// Start app
app.listen(PORT, () => console.log(`app listening on port ${PORT}`));
