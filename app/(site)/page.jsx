import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import HomeHero from '../../components/HomeHero';
import Icon from '../../components/Icon';
import { getSections } from '../../lib/content';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const { 'home.meta': meta } = await getSections(['home.meta']);
  return { title: meta?.title, description: meta?.description };
}

export default async function HomePage() {
  const c = await getSections([
    'home.hero',
    'home.overview',
    'home.economicImpact',
    'home.route',
    'home.callout',
  ]);

  const hero = c['home.hero'];
  const overview = c['home.overview'];
  const impact = c['home.economicImpact'];
  const route = c['home.route'];
  const callout = c['home.callout'];

  return (
    <>
      <HomeHero content={hero} />

      {/* Project Overview */}
      <section id="overview" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-blue-900 mb-4 uppercase">
              {overview.heading}
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">{overview.subheading}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6" data-aos="fade-right">
              {overview.paragraphs.map((p, i) => (
                <p key={i} className="text-gray-700 leading-relaxed">
                  {p}
                </p>
              ))}
              <Link
                href={overview.inlineLink.href}
                className="inline-flex items-center text-orange-500 hover:text-orange-600 transition-all"
              >
                {overview.inlineLink.label} <ArrowRight width={16} height={16} className="ml-2" />
              </Link>
            </div>

            <div className="relative rounded-xl overflow-hidden shadow-xl" data-aos="fade-left">
              <img
                src={overview.image.src}
                alt={overview.image.alt}
                className="w-full h-auto"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-900/80 to-transparent p-6">
                <div className="text-white">
                  <p className="text-sm font-medium">{overview.imageCaption.eyebrow}</p>
                  <h3 className="text-xl font-bold">{overview.imageCaption.title}</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
            {overview.stats.map((stat, i) => {
              const isBlue = stat.color === 'blue';
              return (
                <div
                  key={i}
                  className="bg-white p-6 rounded-lg shadow-md text-center transform transition-all hover:scale-105 hover:shadow-lg"
                  data-aos="fade-up"
                  data-aos-delay={(i + 1) * 100}
                >
                  <div
                    className={`w-16 h-16 ${
                      isBlue ? 'bg-blue-900/10' : 'bg-orange-500/10'
                    } rounded-full flex items-center justify-center mx-auto mb-4`}
                  >
                    <Icon
                      name={stat.icon}
                      width={24}
                      height={24}
                      className={isBlue ? 'text-blue-900' : 'text-orange-500'}
                    />
                  </div>
                  <h3
                    className={`text-lg font-semibold ${
                      isBlue ? 'text-blue-900' : 'text-orange-500'
                    } mb-2`}
                  >
                    {stat.value}
                  </h3>
                  <p className="text-gray-600 text-sm">{stat.label}</p>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link
              className="inline-flex items-center justify-center bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded-md transition-all"
              href={overview.cta.href}
            >
              {overview.cta.label} <ArrowRight width={18} height={18} className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Economic Impact */}
      <section id="impact" className="py-20 bg-white relative overflow-hidden">
        <div
          className="absolute top-0 right-0 w-1/2 h-full bg-blue-900/5 -z-10 skew-x-12 translate-x-20"
          data-aos="fade-left"
        />
        <div className="flex flex-col md:flex-row space-evenly items-center mx-auto px-10">
          <div className="container mx-auto">
            <div className="mr-20">
              <h2 className="text-3xl lg:text-4xl font-bold text-blue-900 mb-4 uppercase">
                {impact.heading}
              </h2>
              <p className="text-gray-600 text-lg mb-8">{impact.subheading}</p>

              <div className="space-y-6 text-gray-700" data-aos="fade-right">
                {impact.paragraphs.map((p, i) => (
                  <p key={i} className="leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6" data-aos="fade-up">
                {impact.metrics.map((m, i) => (
                  <div
                    key={i}
                    className={`${
                      m.color === 'blue' ? 'bg-blue-900' : 'bg-orange-500'
                    } text-white p-6 rounded-lg flex items-center`}
                  >
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                      <Icon name={m.icon} width={24} height={24} className="text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{m.value}</div>
                      <div className="text-sm opacity-80">{m.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href={impact.cta.href}
                className="inline-block mt-8 bg-orange-500 hover:bg-orange-400 text-white px-6 py-3 rounded-md transition-all"
                data-aos="fade-up"
              >
                {impact.cta.label}
              </Link>
            </div>
          </div>
          <div>
            <img
              src={impact.image.src}
              alt={impact.image.alt}
              className="w-full h-full mt-20 md:mt-0 md:w-[950px] md:h-[700px]"
            />
          </div>
        </div>
      </section>

      {/* Expressway Route */}
      <section id="route" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="bg-white p-8 rounded-xl shadow-lg relative" data-aos="fade-right">
              <img src={route.image.src} alt={route.image.alt} className="w-full h-full" />
            </div>
            <div data-aos="fade-left">
              <h2 className="text-3xl lg:text-4xl font-bold text-blue-900 mb-4 uppercase">
                {route.heading}
              </h2>
              <p className="text-gray-600 text-lg mb-8">{route.subheading}</p>
              <div className="space-y-6 text-gray-700">
                {route.paragraphs.map((p, i) => (
                  <p key={i} className="leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
              <Link
                href={route.cta.href}
                className="inline-block mt-8 bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded-md transition-all"
              >
                {route.cta.label}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Callout */}
      <section className="py-16 bg-blue-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">{callout.heading}</h2>
          <p className="text-lg text-white/80 max-w-3xl mx-auto mb-8">{callout.text}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href={callout.primaryCta.href}
              className="bg-white text-blue-900 hover:bg-gray-100 px-8 py-3 rounded-md transition-all"
            >
              {callout.primaryCta.label}
            </Link>
            <Link
              href={callout.secondaryCta.href}
              className="bg-orange-500 hover:bg-orange-400 text-white px-8 py-3 rounded-md transition-all"
            >
              {callout.secondaryCta.label}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
