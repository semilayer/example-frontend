import React from 'react'
import ReactDOM from 'react-dom/client'
import { SemiLayerProvider } from '@semilayer/react'
import { beam } from './beam'
import { App } from './App'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SemiLayerProvider client={beam}>
      <App />
    </SemiLayerProvider>
  </React.StrictMode>,
)
