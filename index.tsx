
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ServiceProvider } from './contexts/ServiceContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ServiceProvider>
      <App />
    </ServiceProvider>
  </React.StrictMode>
);
