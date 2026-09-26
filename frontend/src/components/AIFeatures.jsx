import { Link, useOutletContext } from 'react-router-dom';
import { translations } from '../data/translations';

const AIFeatures = () => {
  const { language } = useOutletContext();
  const t = translations[language].aiFeatures;
  const iconBg = ['bg-[#E8F2E9]', 'bg-[#F5F3EE]', 'bg-amber-50'];
  const features = [
    {
      title: t.smartReportAnalysis,
      description: t.smartReportDesc,
      icon: (
        <svg className="h-7 w-7 text-[#3D6B4F]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      title: t.predictiveHealth,
      description: t.predictiveHealthDesc,
      icon: (
        <svg className="h-7 w-7 text-[#3D6B4F]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
    },
    {
      title: t.ayurvedicIntegration,
      description: t.ayurvedicDesc,
      icon: (
        <svg className="h-7 w-7 text-[#3D6B4F]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3" />
          <path d="M6.343 6.343l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      title: t.doctorConnection,
      description: t.doctorDesc,
      icon: (
        <svg className="h-7 w-7 text-[#3D6B4F]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      title: t.secureRecords,
      description: t.secureDesc,
      icon: (
        <svg className="h-7 w-7 text-[#3D6B4F]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18" />
          <path d="M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      ),
    },
    {
      title: t.integratedMedicine,
      description: t.integratedDesc,
      icon: (
        <svg className="h-7 w-7 text-[#3D6B4F]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M5 3v4M3 5h4M6 17v4m-2-2h4" />
          <path d="M13 3l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
    },
  ];

  return (
    <section id="ai-features" className="bg-[#FDFCF9] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="mb-4 text-4xl text-[#1E3A28]">{t.title}</h2>
          <p className="text-lg text-[#6B8F71]">{t.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <article key={feature.title} className="rounded-2xl border border-green-50 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-lg">
              <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-xl ${iconBg[index % 3]}`}>
                {feature.icon}
              </div>
              <h3 className="mb-3 text-2xl text-[#1E3A28]">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-[#6B8F71]">{feature.description}</p>
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

export default AIFeatures;
