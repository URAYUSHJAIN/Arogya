import { Link, useOutletContext } from 'react-router-dom';
import { translations } from '../data/translations';

const HowItWorks = () => {
  const { language } = useOutletContext();
  const t = translations[language].howItWorks;
  const steps = [
    {
      number: '01',
      title: t.step1Title,
      description: t.step1Desc,
      icon: (
        <svg className="h-7 w-7 text-[#3D6B4F]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
    },
    {
      number: '02',
      title: t.step2Title,
      description: t.step2Desc,
      icon: (
        <svg className="h-7 w-7 text-[#3D6B4F]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3" />
          <path d="M6.343 6.343l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      number: '03',
      title: t.step3Title,
      description: t.step3Desc,
      icon: (
        <svg className="h-7 w-7 text-[#3D6B4F]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="bg-[#F5F3EE] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="mb-4 text-4xl text-[#1E3A28]">{t.title}</h2>
          <p className="text-lg text-[#6B8F71]">{t.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {steps.map((step) => (
            <article key={step.number} className="relative overflow-hidden rounded-2xl border border-[#C8DFC9] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
              <span className="absolute right-4 top-2 text-6xl font-semibold text-[#E8F2E9]">{step.number}</span>
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-[#E8F2E9]">
                {step.icon}
              </div>
              <h3 className="mb-3 text-2xl text-[#1E3A28]">{step.title}</h3>
              <p className="text-sm leading-relaxed text-[#6B8F71]">{step.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/ai-analysis"
            className="inline-flex rounded-lg bg-[#3D6B4F] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2A4A35]"
          >
            {t.cta}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
