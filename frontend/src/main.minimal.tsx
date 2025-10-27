import React from 'react'
import ReactDOM from 'react-dom/client'
import AppMinimal from './App.minimal.tsx'
import './index.css'

console.log('main.minimal.tsx loading...');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppMinimal />
  </React.StrictMode>,
)

console.log('main.minimal.tsx loaded');
