import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { UserStoreProvider } from './hooks/useUserStore';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <UserStoreProvider>
        <App />
      </UserStoreProvider>
    </BrowserRouter>
  </React.StrictMode>
);
