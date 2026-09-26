import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { translations } from '../data/translations';

const Header = ({ language }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const t = translations[language].header;
  const logoSrc = `${import.meta.env.BASE_URL}logo1.jpg`;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavClick = (e, sectionId) => {
    e.preventDefault();
    
    // If not on home page, navigate to home first
    if (location.pathname !== '/') {
      navigate('/');
      // Wait for navigation to complete, then scroll
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      // Already on home page, just scroll
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    
    // Close mobile menu if open
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-4 z-50 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto mt-4 flex max-w-2xl items-center justify-between rounded-2xl border border-green-100 bg-white/90 px-6 py-3 shadow-sm backdrop-blur-md">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3D6B4F]">
            <img
              src={logoSrc}
              alt="ArogyaPlus Logo"
              className="h-5 w-5 object-contain"
              onError={(event) => {
                event.currentTarget.src = `${import.meta.env.BASE_URL}logo.ico`;
              }}
            />
          </div>
        </Link>

        <nav className="hidden items-center gap-4 md:flex">
          <a href="/#home" onClick={(e) => handleNavClick(e, 'home')} className="text-sm text-gray-600 transition-colors hover:text-[#3D6B4F]">
            {t.home}
          </a>
          <a href="/#services" onClick={(e) => handleNavClick(e, 'services')} className="text-sm text-gray-600 transition-colors hover:text-[#3D6B4F]">
            {t.services}
          </a>
          <a href="/#ai-features" onClick={(e) => handleNavClick(e, 'ai-features')} className="text-sm text-gray-600 transition-colors hover:text-[#3D6B4F]">
            {t.aiPlatform}
          </a>
          <Link to="/emergency" className="text-sm text-gray-600 transition-colors hover:text-[#3D6B4F]">
            Emergency
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/ai-analysis"
            className="rounded-xl bg-[#2A4A35] px-4 py-2 text-sm text-white transition-colors hover:bg-[#1E3A28]"
          >
            Upload Report
          </Link>
        </div>

        <button
          className="rounded-lg p-2 text-[#3D6B4F] transition-colors hover:bg-[#E8F2E9] md:hidden"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isMobileMenuOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="mx-auto mt-2 max-w-2xl rounded-2xl border border-green-100 bg-white p-4 md:hidden" id="mobile-menu">
          <nav className="flex flex-col gap-2">
            <a href="/#home" onClick={(e) => handleNavClick(e, 'home')} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-[#E8F2E9] hover:text-[#3D6B4F]">{t.home}</a>
            <a href="/#services" onClick={(e) => handleNavClick(e, 'services')} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-[#E8F2E9] hover:text-[#3D6B4F]">{t.services}</a>
            <a href="/#ai-features" onClick={(e) => handleNavClick(e, 'ai-features')} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-[#E8F2E9] hover:text-[#3D6B4F]">{t.aiPlatform}</a>
            <Link to="/emergency" onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-[#E8F2E9] hover:text-[#3D6B4F]">Emergency</Link>
            <Link to="/ai-analysis" onClick={() => setIsMobileMenuOpen(false)} className="mt-2 rounded-xl bg-[#2A4A35] px-4 py-2 text-center text-sm text-white">Upload Report</Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
