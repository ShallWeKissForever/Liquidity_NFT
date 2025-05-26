import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";

createRoot(document.getElementById('root')!).render(
  <StrictMode>

    <AptosWalletAdapterProvider autoConnect={true} >
      <App />
    </AptosWalletAdapterProvider>

  </StrictMode>,
)
