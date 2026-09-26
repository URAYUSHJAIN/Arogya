import { useOutletContext } from 'react-router-dom';
import { translations } from '../data/translations';

const Services = () => {
  const { language } = useOutletContext();
  const t = translations[language].services;
  const iconBg = ['bg-[#E8F2E9]', 'bg-[#F5F3EE]', 'bg-amber-50'];
  const services = [
    {
      title: t.service1Title,
      description: t.service1Desc,
      href: '#ai-features',
      icon: (
        <svg className="h-7 w-7 text-[#3D6B4F]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586" />
          <path d="M12.293 2.293l5.414 5.414A1 1 0 0118 8.414V19a2 2 0 01-2 2" />
        </svg>
      ),
    },
    {
      title: t.service2Title,
      description: t.service2Desc,
      href: '#contact',
      icon: (
        <svg className="h-7 w-7 text-[#3D6B4F]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
          <path d="M9 7h1m4 0h1m-6 4h1m4 0h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5" />
        </svg>
      ),
    },
    {
      title: t.service3Title,
      description: t.service3Desc,
      href: '#contact',
      icon: (
        <svg className="h-7 w-7 text-[#3D6B4F]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243" />
          <path d="M6.343 16.657a8 8 0 1111.314 0M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      title: t.service4Title,
      description: t.service4Desc,
      href: '#contact',
      icon: (
        <svg className="h-7 w-7 text-[#3D6B4F]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M8 12h.01M12 12h.01M16 12h.01" />
          <path d="M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72" />
          <path d="M4.395 16.28A7.96 7.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8" />
        </svg>
      ),
    },
  ];

  return (
    <section id="services" className="bg-[#FDFCF9] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="mb-4 text-4xl text-[#1E3A28]">{t.title}</h2>
          <p className="text-lg text-[#6B8F71]">{t.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {services.map((service, index) => (
            <article key={service.title} className="rounded-2xl border border-green-50 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-lg">
              <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-xl ${iconBg[index % 3]}`}>
                {service.icon}
              </div>
              <h3 className="mb-3 text-2xl text-[#1E3A28]">{service.title}</h3>
              <p className="mb-4 text-sm leading-relaxed text-[#6B8F71]">{service.description}</p>
              <a href={service.href} className="inline-flex items-center gap-2 text-sm font-semibold text-[#3D6B4F] hover:text-[#2A4A35]">
                {t.learnMore}
                <span aria-hidden>→</span>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;

