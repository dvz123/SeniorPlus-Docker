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

// Simple helper to log when a section mounts (dev/debug only)
function withLogging(Component, name) {
  return function Wrapped(props) {
    useEffect(() => {
      // eslint-disable-next-line no-console
      console.log(`[tela-landing] mounted: ${name}`);
    }, []);
    return <Component {...props} />;
  };
}

const HeaderL = withLogging(Header, 'Header');
const HeroL = withLogging(Hero, 'Hero');
const TechStackL = withLogging(TechStack, 'TechStack');
const TargetAudienceL = withLogging(TargetAudience, 'TargetAudience');
const FeaturesL = withLogging(Features, 'Features');
const PricingL = withLogging(Pricing, 'Pricing');
const AgingStatsL = withLogging(AgingStats, 'AgingStats');
const PartnershipsL = withLogging(Partnerships, 'Partnerships');
const CTAL = withLogging(CTA, 'CTA');
const FooterL = withLogging(Footer, 'Footer');

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
        <HeaderL />
        <HeroL />
        <TechStackL />
        <TargetAudienceL />
  <FeaturesL />
  <About />
  <PricingL />
        <AgingStatsL />
        <PartnershipsL />
        <CTAL />
        <FooterL />
      </ErrorBoundary>
    </div>
  );
}

export default App;
