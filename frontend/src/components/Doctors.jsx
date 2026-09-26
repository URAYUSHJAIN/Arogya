import { useOutletContext } from 'react-router-dom';
import { translations } from '../data/translations';

const Doctors = () => {
  const { language } = useOutletContext();
  const t = translations[language].doctors;

  const doctors = [
    {
      name: "Dr. Sarah Mitchell",
      specialty: "Cardiologist",
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop"
    },
    {
      name: "Dr. James Anderson",
      specialty: "Neurologist",
      image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop"
    },
    {
      name: "Dr. Emily Chen",
      specialty: "Orthopedic Surgeon",
      image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop"
    },
    {
      name: "Dr. Michael Roberts",
      specialty: "General Physician",
      image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop"
    }
  ];

  return (
    <section id="doctors" className="bg-[#FDFCF9] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl text-[#1E3A28]">
            {t.title}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[#6B8F71]">
            {t.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {doctors.map((doctor, index) => (
            <article 
              key={index}
              className="overflow-hidden rounded-2xl border border-[#C8DFC9] bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg"
            >
              <div className="h-72 overflow-hidden">
                <img 
                  src={doctor.image}
                  alt={doctor.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-6">
                  <h3 className="mb-1 text-2xl text-[#1E3A28]">{doctor.name}</h3>
                  <p className="mb-4 text-sm font-medium text-[#6B8F71]">{doctor.specialty}</p>
                  <button className="w-full rounded-lg bg-[#3D6B4F] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2A4A35]">
                    {t.viewProfile}
                  </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Doctors;
