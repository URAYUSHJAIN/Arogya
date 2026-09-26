import { useOutletContext } from 'react-router-dom';
import { translations } from '../data/translations';

const Specialties = () => {
  const { language } = useOutletContext();
  const t = translations[language].specialties;
  const cards = [
    {
      title: t.spec1Title,
      description: t.spec1Desc,
      iconBg: 'bg-[#E8F2E9]',
      icon: (
        <svg className="h-8 w-8 text-[#3D6B4F]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3" />
          <path d="M6.343 6.343l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      title: t.spec2Title,
      description: t.spec2Desc,
      iconBg: 'bg-[#F5F3EE]',
      icon: (
        <svg className="h-8 w-8 text-[#3D6B4F]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
    {
      title: t.spec3Title,
      description: t.spec3Desc,
      iconBg: 'bg-amber-50',
      icon: (
        <svg className="h-8 w-8 text-[#3D6B4F]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      title: t.spec4Title,
      description: t.spec4Desc,
      iconBg: 'bg-[#E8F2E9]',
      icon: (
        <svg className="h-8 w-8 text-[#3D6B4F]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      title: t.spec5Title,
      description: t.spec5Desc,
      iconBg: 'bg-[#F5F3EE]',
      icon: (
        <svg className="h-8 w-8 text-[#3D6B4F]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4" />
          <path d="M6 18a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10" />
          <path d="M18 18a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
    },
    {
      title: 'Dental Care',
      description: 'Complete dental health and cosmetic dentistry',
      iconBg: 'bg-amber-50',
      icon: (
        <svg className="h-8 w-8 text-[#3D6B4F]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Ophthalmology',
      description: 'Expert eye care and vision correction services',
      iconBg: 'bg-[#E8F2E9]',
      icon: (
        <svg className="h-8 w-8 text-[#3D6B4F]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7" />
          <path d="M21.542 12c-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7" />
        </svg>
      ),
    },
    {
      title: 'Face & Facilities',
      description: 'Facial treatments and modern medical facilities',
      iconBg: 'bg-[#F5F3EE]',
      icon: (
        <svg className="h-8 w-8 text-[#3D6B4F]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M5 3v4M3 5h4M6 17v4m-2-2h4" />
          <path d="M13 3l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
    },
  ];

  return (
    <section id="specialties" className="bg-[#FDFCF9] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl text-[#1E3A28]">
            {t.title}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[#6B8F71]">
            {t.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card) => (
            <article key={card.title} className="rounded-2xl border border-green-50 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-lg">
              <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${card.iconBg}`}>
                {card.icon}
              </div>
              <h3 className="mb-2 text-2xl text-[#1E3A28]">{card.title}</h3>
              <p className="mb-4 text-sm text-[#6B8F71]">{card.description}</p>
              <a href="#contact" className="inline-flex items-center gap-2 text-sm font-semibold text-[#3D6B4F] hover:text-[#2A4A35]">
                {t.readMore}
                <span aria-hidden>→</span>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Specialties;
