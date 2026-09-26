import { useOutletContext } from 'react-router-dom';
import { translations } from '../data/translations';

const About = () => {
  const { language } = useOutletContext();
  const t = translations[language].about;

  return (
    <section id="about" className="bg-[#FDFCF9] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          
          {/* Left Column - Image Collage */}
          <div className="relative">
            <div className="mx-auto aspect-square w-full max-w-md overflow-hidden rounded-full border-8 border-[#E8F2E9] shadow-lg">
              <img 
                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=800&fit=crop" 
                alt="Medical Professional" 
                className="h-full w-full object-cover"
              />
            </div>

            <div className="absolute left-0 top-0 hidden h-24 w-24 overflow-hidden rounded-full border-4 border-[#FDFCF9] shadow-md md:block">
              <img 
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop" 
                alt="Doctor" 
                className="h-full w-full object-cover"
              />
            </div>

            <div className="absolute bottom-10 right-10 hidden h-32 w-32 overflow-hidden rounded-full border-4 border-[#FDFCF9] shadow-md md:block">
              <img 
                src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&h=300&fit=crop" 
                alt="AI Analysis" 
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div>
            <h2 className="mb-8 text-4xl text-[#1E3A28] sm:text-5xl">
              {t.title} <br />
              <span className="text-[#3D6B4F]">{t.subtitle}</span>
            </h2>

            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E8F2E9] text-[#3D6B4F]">
                  <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="mb-2 text-2xl text-[#1E3A28]">{t.feature1Title}</h3>
                  <p className="leading-relaxed text-[#6B8F71]">
                    {t.feature1Desc}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F5F3EE] text-[#3D6B4F]">
                  <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <div>
                  <h3 className="mb-2 text-2xl text-[#1E3A28]">{t.feature2Title}</h3>
                  <p className="leading-relaxed text-[#6B8F71]">
                    {t.feature2Desc}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-[#3D6B4F]">
                  <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="mb-2 text-2xl text-[#1E3A28]">{t.feature3Title}</h3>
                  <p className="leading-relaxed text-[#6B8F71]">
                    {t.feature3Desc}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
