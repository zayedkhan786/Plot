import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 901px)');
    const onMq = () => {
      if (mq.matches) setMobileNavOpen(false);
    };
    mq.addEventListener('change', onMq);
    return () => mq.removeEventListener('change', onMq);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileNavOpen]);

  return (
    <div className="app-layout">
      <header className="mobile-header">
        <button
          type="button"
          className="mobile-menu-btn"
          aria-expanded={mobileNavOpen}
          aria-controls="app-sidebar"
          onClick={() => setMobileNavOpen((o) => !o)}
        >
          <span className="mobile-menu-icon" aria-hidden />
          <span className="sr-only">{mobileNavOpen ? 'Close menu' : 'Open menu'}</span>
        </button>
        <div className="mobile-header-brand">
          <span className="mobile-header-title">Shree Dungar</span>
          <span className="mobile-header-sub">Residency · Admin</span>
        </div>
      </header>

      <Sidebar mobileOpen={mobileNavOpen} onCloseNav={() => setMobileNavOpen(false)} />

      <main className="main-content" id="main-content">
        {children}
      </main>
    </div>
  );
}
