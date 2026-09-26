import { useOutletContext } from 'react-router-dom';
import { translations } from '../data/translations';

const PatientCare = () => {
  const { language } = useOutletContext();
  const t = translations[language].patientCare;

  return (
    <section id="patient-care" className="bg-[#F5F3EE] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="mb-8 text-4xl text-[#1E3A28]">
              {t.title}
            </h2>
            
            <div className="space-y-5 mb-10">
              {[
                t.item1,
                t.item2,
                t.item3,
                t.item4,
                t.item5,
                t.item6,
                t.item7,
                t.item8
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-4 group">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C8DFC9] transition-colors duration-300 group-hover:bg-[#A8C5AE]">
                    <svg className="h-4 w-4 text-[#2A4A35]" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-lg text-[#2A4A35] transition-colors duration-300 group-hover:text-[#1E3A28]">{item}</p>
                </div>
              ))}
            </div>

            <button className="inline-flex rounded-lg bg-[#3D6B4F] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2A4A35]">
              {t.cta}
            </button>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl border border-[#C8DFC9] bg-white shadow-sm">
              <img 
                src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=600&h=600&fit=crop" 
                alt="Medical team providing patient care"
                className="h-auto w-full object-cover"
                loading="lazy"
              />
            </div>
            
            <div className="absolute -bottom-4 -right-4 rounded-xl border border-[#C8DFC9] bg-white p-6 shadow-md">
              <div className="mb-2 text-4xl text-[#1E3A28]">{t.stat1Value}</div>
              <div className="text-base font-semibold text-[#2A4A35]">{t.stat1Label}</div>
              <div className="mt-2 text-sm text-[#6B8F71]">{t.stat2Label}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PatientCare;
