import { useOutletContext } from 'react-router-dom';
import { translations } from '../data/translations';

const MobileApp = () => {
  const { language } = useOutletContext();
  const t = translations[language].mobileApp;

  return (
    <section className="bg-[#FDFCF9] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="mb-6 text-4xl text-[#1E3A28]">{t.title}</h2>

            <div className="mb-8 inline-flex items-center gap-3 rounded-xl border border-[#C8DFC9] bg-white px-4 py-3">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-5 w-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="ml-2 text-2xl font-bold text-[#1E3A28]">4.9</span>
              <span className="ml-1 border-l border-[#C8DFC9] pl-3 text-sm text-[#6B8F71]">{t.ratingCount}</span>
            </div>

            <p className="mb-8 text-lg leading-relaxed text-[#6B8F71]">{t.description}</p>

            <div className="space-y-4 mb-10">
              {[t.feature1, t.feature2, t.feature3, t.feature4].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8F2E9]">
                    <svg className="h-5 w-5 text-[#3D6B4F]" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[#2A4A35]">{item}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
              <a
                href="#app-store"
                className="flex items-center gap-3 rounded-xl border border-[#C8DFC9] bg-white px-6 py-3 text-[#1E3A28] shadow-sm transition-colors hover:bg-[#F5F3EE]"
              >
                <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div className="text-left">
                  <div className="text-xs text-[#6B8F71]">{t.downloadOn}</div>
                  <div className="text-lg font-bold">App Store</div>
                </div>
              </a>

              <a
                href="#google-play"
                className="flex items-center gap-3 rounded-xl border border-[#C8DFC9] bg-white px-6 py-3 text-[#1E3A28] shadow-sm transition-colors hover:bg-[#F5F3EE]"
              >
                <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3.609 1.814L13.792 12 3.609 22.186a.996.996 0 0 1-.609-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z"/>
                </svg>
                <div className="text-left">
                  <div className="text-xs text-[#6B8F71]">{t.getItOn}</div>
                  <div className="text-lg font-bold">Google Play</div>
                </div>
              </a>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="w-72 rounded-3xl border-4 border-[#C8DFC9] bg-white p-4 shadow-lg">
              <div className="overflow-hidden rounded-2xl bg-[#F5F3EE] p-6 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#3D6B4F]">
                  <svg className="h-10 w-10 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="mb-2 text-2xl text-[#1E3A28]">ArogyaPlus</h3>
                <p className="mb-6 text-sm text-[#6B8F71]">AI Health Insights</p>
                <button className="w-full rounded-lg bg-[#3D6B4F] py-3 text-sm font-semibold text-white hover:bg-[#2A4A35]">Get Started</button>
                <div className="mt-6 rounded-lg bg-[#E8F2E9] px-4 py-3 text-left">
                  <div className="text-xs text-[#6B8F71]">Analysis Complete</div>
                  <div className="text-sm font-semibold text-[#1E3A28]">Healthy Heart</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MobileApp;
