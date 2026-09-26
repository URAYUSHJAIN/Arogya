import { useOutletContext } from 'react-router-dom';
import { translations } from '../data/translations';

const Blog = () => {
  const { language } = useOutletContext();
  const t = translations[language].blog;

  const articles = [
    {
      category: "Cardiology",
      title: "10 Ways to Keep Your Heart Healthy",
      excerpt: "Learn essential tips for maintaining cardiovascular health and preventing heart disease through lifestyle changes and regular checkups.",
      image: "https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=600&h=400&fit=crop",
      date: "Jan 15, 2025"
    },
    {
      category: "Mental Health",
      title: "Managing Stress in Modern Life",
      excerpt: "Discover effective strategies for stress management and maintaining mental wellness in today's fast-paced world.",
      image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=400&fit=crop",
      date: "Jan 12, 2025"
    },
    {
      category: "Nutrition",
      title: "Balanced Diet for Better Health",
      excerpt: "Expert nutritionists share insights on creating a balanced diet plan that supports overall health and wellbeing.",
      image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=400&fit=crop",
      date: "Jan 10, 2025"
    }
  ];

  return (
    <section id="news" className="bg-[#F5F3EE] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl text-[#1E3A28]">
            {t.title}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[#6B8F71]">
            {t.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article, index) => (
            <div 
              key={index}
              className="overflow-hidden rounded-2xl border border-[#C8DFC9] bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg"
            >
              <div className="relative h-56 overflow-hidden">
                <img 
                  src={article.image}
                  alt={article.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <span className="absolute left-4 top-4 rounded-full bg-[#3D6B4F] px-4 py-1 text-sm font-semibold text-white">
                  {article.category}
                </span>
              </div>
              <div className="p-6">
                <h3 className="mb-3 text-2xl text-[#1E3A28]">
                  {article.title}
                </h3>
                <p className="mb-6 line-clamp-3 leading-relaxed text-[#6B8F71]">
                  {article.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6B8F71]">{article.date}</span>
                  <a href="#read-more" className="inline-flex items-center gap-2 text-sm font-semibold text-[#3D6B4F] hover:text-[#2A4A35]">
                    {t.readMore}
                    <span aria-hidden>→</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Blog;
