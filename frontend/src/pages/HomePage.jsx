import { useOutletContext } from 'react-router-dom';
import Hero from '../components/Hero';
import About from '../components/About';
import AIFeatures from '../components/AIFeatures';
import HowItWorks from '../components/HowItWorks';
import Services from '../components/Services';
import PatientCare from '../components/PatientCare';
import Specialties from '../components/Specialties';
import Testimonials from '../components/Testimonials';
import Doctors from '../components/Doctors';
import Blog from '../components/Blog';
import { translations } from '../data/translations';

const HomePage = () => {
  const { language } = useOutletContext();
  const t = translations[language].howItWorks;

  return (
    <>
      <Hero />
      <section className="bg-[#2A4A35] py-8">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
          <div className="text-center">
            <p className="text-4xl text-green-100">&lt;30s</p>
            <p className="mt-2 text-sm text-green-200">{t.stat1Label}</p>
          </div>
          <div className="text-center">
            <p className="text-4xl text-green-100">95%+</p>
            <p className="mt-2 text-sm text-green-200">{t.stat2Label}</p>
          </div>
          <div className="text-center">
            <p className="text-4xl text-green-100">24/7</p>
            <p className="mt-2 text-sm text-green-200">{t.stat3Label}</p>
          </div>
          <div className="text-center">
            <p className="text-4xl text-green-100">100+</p>
            <p className="mt-2 text-sm text-green-200">{t.stat4Label}</p>
          </div>
        </div>
      </section>
      <About />
      <AIFeatures />
      <HowItWorks />
      <Services />
      <PatientCare />
      <Specialties />
      <Testimonials />
      <Doctors />
      <Blog />
    </>
  );
};

export default HomePage;
