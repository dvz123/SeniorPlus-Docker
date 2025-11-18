import './App.css';
import './styles/global.css';
import Header from './components/Header';
import Hero from './components/Hero';
import AgingStats from './components/AgingStats';
import Features from './components/Features';
import TechStack from './components/TechStack';
import Partnerships from './components/Partnerships';
import TargetAudience from './components/TargetAudience';
import About from './components/About';
import Pricing from './components/Pricing';
import CTA from './components/CTA';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    document.body.classList.add('landing-body');
    return () => {
      document.body.classList.remove('landing-body');
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const shouldRestoreDarkMode = root.classList.contains('dark-mode');

    if (shouldRestoreDarkMode) {
      root.dataset.restoreDarkMode = 'true';
      root.classList.remove('dark-mode');
    }

    return () => {
      if (root.dataset.restoreDarkMode === 'true') {
        root.classList.add('dark-mode');
        delete root.dataset.restoreDarkMode;
      }
    };
  }, []);

  return (
  <div className="landing-root App">
      <ErrorBoundary>
          <Header />
          <Hero />
          <TechStack />
          <TargetAudience />
          <Features />
          <About />
          <Pricing />
          <AgingStats />
          <Partnerships />
          <CTA />
          <Footer />
      </ErrorBoundary>
    </div>
  );
}

export default App;
