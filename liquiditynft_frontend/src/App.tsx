import Header from './Header'
import SwapFeature from './Body'
import { LanguageProvider } from './context/LanguageContext'
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
        <Header />
        <SwapFeature />
      </LanguageProvider>
    </>
  )

}

export default App
