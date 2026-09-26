import { Link, useNavigate, useLocation } from 'react-router-dom';
import { translations } from '../data/translations';

const Footer = ({ language = 'en' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const t = translations[language].footer;

  const handleNavClick = (e, sectionId) => {
    e.preventDefault();
    
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="bg-[#1E3A28] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3D6B4F] text-xl font-bold text-white">+</div>
              <span className="text-xl font-semibold">ArogyaPlus</span>
            </div>
            <p className="text-sm leading-relaxed text-[#A8C5AE]">
              AI-assisted healthcare insights, trusted specialists, and faster care decisions for every family.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-lg text-[#E8F2E9]">{t.quickLinks}</h3>
            <ul className="space-y-2">
              <li>
                <a href="/#about" onClick={(e) => handleNavClick(e, 'about')} className="text-sm text-[#A8C5AE] transition-colors hover:text-[#E8F2E9]">
                  {t.aboutUs}
                </a>
              </li>
              <li>
                <a href="/#ai-features" onClick={(e) => handleNavClick(e, 'ai-features')} className="text-sm text-[#A8C5AE] transition-colors hover:text-[#E8F2E9]">
                  {t.aiTechnology}
                </a>
              </li>
              <li>
                <Link to="/ai-analysis" className="text-sm text-[#A8C5AE] transition-colors hover:text-[#E8F2E9]">
                  {t.aiReportAnalysis}
                </Link>
              </li>
              <li>
                <a href="/#doctors" onClick={(e) => handleNavClick(e, 'doctors')} className="text-sm text-[#A8C5AE] transition-colors hover:text-[#E8F2E9]">
                  {t.ourDoctors}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg text-[#E8F2E9]">{t.services}</h3>
            <ul className="space-y-2">
              <li>
                <a href="/#services" onClick={(e) => handleNavClick(e, 'services')} className="text-sm text-[#A8C5AE] transition-colors hover:text-[#E8F2E9]">
                  {t.ourServices}
                </a>
              </li>
              <li>
                <a href="/#specialties" onClick={(e) => handleNavClick(e, 'specialties')} className="text-sm text-[#A8C5AE] transition-colors hover:text-[#E8F2E9]">
                  {t.specialties}
                </a>
              </li>
              <li>
                <a href="/#patient-care" onClick={(e) => handleNavClick(e, 'patient-care')} className="text-sm text-[#A8C5AE] transition-colors hover:text-[#E8F2E9]">
                  {t.patientCare}
                </a>
              </li>
              <li>
                <Link to="/emergency" className="text-sm text-[#C8DFC9] transition-colors hover:text-white">
                  {t.emergencyServices}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg text-[#E8F2E9]">{t.contactUs}</h3>
            <ul className="space-y-2 text-sm text-[#A8C5AE]">
              <li>B-Block, Sector 18, Noida, UP</li>
              <li>
                <a href="tel:+911124567890" className="transition-colors hover:text-[#E8F2E9]">
                  +91 11 2456 7890
                </a>
              </li>
              <li>
                <a href="mailto:info@arogyaplus.com" className="transition-colors hover:text-[#E8F2E9]">
                  info@arogyaplus.com
                </a>
              </li>
              <li className="mt-2 flex gap-4">
                <a href="tel:108" className="text-[#C8DFC9] transition-colors hover:text-[#E8F2E9]">
                  Emergency: 108
                </a>
                <a href="tel:102" className="text-[#C8DFC9] transition-colors hover:text-[#E8F2E9]">
                  Ambulance: 102
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-[#2A4A35] bg-[#1E3A28]">
        <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-[#A8C5AE] sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} ArogyaPlus. All rights reserved.</p>
          <p className="mt-2">Medical disclaimer: AI insights are assistive and should not replace professional medical diagnosis.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
