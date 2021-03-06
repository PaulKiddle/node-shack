import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';
import { onSubscriptionChange } from "./service-worker";

if(getenv('BASE_URL').indexOf(location.protocol) !== 0){
  location.replace(getenv('BASE_URL'));
}

const state = {
  ...window.__INITIAL_STATE__,
  pushAvailable: 'serviceWorker' in navigator
}

const app = ReactDOM.hydrate(
  <App state={state} />,
  document.getElementById('root')
)

onSubscriptionChange(sub => app.setState({ subscribed: !!sub })
);
