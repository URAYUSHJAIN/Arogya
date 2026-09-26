import { useOutletContext } from 'react-router-dom';
import { translations } from '../data/translations';

const Testimonials = () => {
  const { language } = useOutletContext();
  const t = translations[language].testimonials;

  const testimonials = [
    {
      quote: "The care I received was exceptional. The medical team was professional, compassionate, and truly dedicated to my recovery. I highly recommend their services.",
      name: "Sarah Johnson",
      role: "Cardiology Patient",
      initials: 'SJ'
    },
    {
      quote: "Outstanding orthopedic care! The doctors took time to explain my treatment options and the rehabilitation process was smooth and effective. Forever grateful!",
      name: "Michael Chen",
      role: "Orthopedics Patient",
      initials: 'MC'
    },
    {
      quote: "From consultation to follow-up, every step was handled with utmost care and professionalism. The facilities are world-class and the staff is incredibly supportive.",
      name: "Emily Rodriguez",
      role: "General Care Patient",
      initials: 'ER'
    }
  ];

  return (
    <section className="bg-[#F5F3EE] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="mb-4 text-4xl text-[#1E3A28]">{t.title}</h2>
          <p className="text-lg text-[#6B8F71]">{t.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          {testimonials.slice(0, 2).map((item) => (
            <article key={item.name} className="rounded-2xl border border-[#C8DFC9] bg-white p-6 shadow-sm">
              <div className="mb-4 flex text-amber-500">
                {Array.from({ length: 5 }).map((_, index) => (
                  <span key={`${item.name}-star-${index}`} className="text-lg">★</span>
                ))}
              </div>

              <p className="mb-6 text-lg italic leading-relaxed text-[#2A4A35]">"{item.quote}"</p>

              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E8F2E9] text-sm font-semibold text-[#1E3A28]">
                  {item.initials}
                </div>
                <div>
                  <h4 className="text-base font-semibold text-[#1E3A28]">{item.name}</h4>
                  <p className="text-sm text-[#6B8F71]">{item.role}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
