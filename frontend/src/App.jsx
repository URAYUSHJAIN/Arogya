import { Outlet } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import PillLoader from './components/PillLoader'

function App() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    // Show loader for 2 seconds when app starts
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Show initial loader
  if (isInitialLoading) {
    return <PillLoader text="Welcome to ArogyaPlus AI Powered Healthcare" />;
  }

  return (
    <div className="min-h-screen flex flex-col scroll-smooth">
      <Header language={language} setLanguage={setLanguage} />
      
      <main className="flex-1">
        <Outlet context={{ language }} />
      </main>
      
      <Footer language={language} />
    </div>
  )
}

export default App
