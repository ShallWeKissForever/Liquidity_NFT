import Header from './Header'
import Trading from './pages/Trading'
import LiquidityPool from './pages/LiquidityPool'
import Query from './pages/Query'
import { LanguageProvider } from './context/LanguageContext'
import { TokenProvider } from './context/TokenContext'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
// @ts-ignore 忽略类型检查警告
import { initParticles } from './utils/particles';
import { useEffect } from 'react';

function App() {

  useEffect(() => {
    initParticles();
  }, []);

  return (
    <>
      <LanguageProvider>
        <TokenProvider>
        <Router>
          <Header />
          <Routes>
            <Route path="/" element={<Trading />} />
            <Route path="/liquidity" element={<LiquidityPool />} />
            <Route path="/query" element={<Query />} />
          </Routes>
        </Router>
        </TokenProvider>
      </LanguageProvider>
    </>
  )

}

export default App
