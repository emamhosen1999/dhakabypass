import { getContent } from '../../../lib/content';
import { getNewsUpdates } from '../../../lib/news';
import NewsletterForm from '../../../components/NewsletterForm';

export const dynamic = 'force-dynamic';

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

/**
 * latest-updates — dynamic news items from MySQL / fallback seed + editable page copy & gallery.
 */
export default async function LatestUpdatesPage() {
  const [c, news] = await Promise.all([
    getContent('page.latest-updates'),
    getNewsUpdates(true),
  ]);

  return (
    <>
      <section className="relative py-20 bg-gradient-to-r from-blue-900 to-blue-800">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url('${c.img1 || '/road.webp'}')` }}
        />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h1 className="text-4xl font-bold mb-4 uppercase">{c.t1 || 'Latest Updates'}</h1>
            <p className="text-xl opacity-90 mb-8">
              {c.t2 || 'Stay informed with the latest news and updates about the Dhaka Bypass Expressway project'}
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-blue-900 mb-8 text-center uppercase">
            {c.t3 || 'Latest News Coverage'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {news.map((item) => (
              <a
                key={item.id || item.slug}
                href={item.url || `#`}
                target={item.url ? '_blank' : '_self'}
                rel={item.url ? 'noopener noreferrer' : undefined}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
              >
                <div className="p-6 flex-grow flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {item.category || 'Operations'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(item.published_at)}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {item.excerpt}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-newspaper text-orange-500 mr-2"
                      >
                        <path d="M15 18h-5" />
                        <path d="M18 14h-8" />
                        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9a2 2 0 0 1 2-2h2" />
                        <rect width="8" height="4" x="10" y="6" rx="1" />
                      </svg>
                      <span className="text-sm text-gray-500">{item.source || 'DBEDC'}</span>
                    </div>
                    <div className="flex items-center text-orange-500 hover:text-orange-600 font-medium text-sm">
                      <span className="mr-1">Read More</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-external-link"
                      >
                        <path d="M15 3h6v6" />
                        <path d="M10 14 21 3" />
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-blue-900 mb-8 text-center uppercase">
            {c.t40 || 'Photo Gallery'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 36 }, (_, i) => {
              const imgKey = `img${i + 2}`;
              const src = c[imgKey] || `/photo/${i + 1}.webp`;
              return (
                <img
                  key={imgKey}
                  src={src}
                  alt={`Dhaka Bypass Photo ${i + 1}`}
                  className="w-full h-48 object-cover transition-transform hover:scale-105 cursor-pointer rounded-lg shadow-sm"
                />
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-blue-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{c.t41 || 'Stay Updated with DBEDC'}</h2>
          <p className="text-lg text-white/80 max-w-3xl mx-auto mb-8">
            {c.t42 ||
              'Subscribe to our newsletter to receive the latest updates about the Dhaka Bypass Expressway project'}
          </p>
          <NewsletterForm buttonText={c.t43 || 'Subscribe'} />
        </div>
      </section>
    </>
  );
}
