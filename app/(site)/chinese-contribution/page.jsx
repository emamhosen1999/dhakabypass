import { getContent } from '../../../lib/content';

export const dynamic = 'force-dynamic';

/**
 * chinese-contribution — reconstructed from the original site's live DOM.
 * All copy and imagery comes from content key "page.chinese-contribution" so the admin
 * panel can edit every field.
 */
export default async function ChineseContributionPage() {
  const c = await getContent('page.chinese-contribution');
  return (
    <>
      <section className="relative h-96 md:h-screen overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-blue-800 opacity-90" />
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${c.img1}')`, transform: "translateY(0px)", opacity: "0.5" }} />
        <div className="container mx-auto px-4 z-10 text-center text-white">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 uppercase">
              {c.t1}
            </h1>
            <p className="text-xl mb-8 text-white/80 max-w-3xl mx-auto">
              {c.t2}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a href="#overview" className="bg-blue-700 hover:bg-blue-600 px-6 py-3 rounded-md text-white transition-all inline-flex items-center">
                {c.t3}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right ml-2">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </a>
              <a href="/stakeholders" className="bg-orange-500 hover:bg-orange-400 px-6 py-3 rounded-md text-white transition-all inline-flex items-center">
                {c.t4}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right ml-2">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>
      <section id="overview" className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="lg:w-1/2 animate-on-scroll opacity-0 transform translate-y-8 transition-all duration-700">
              <h2 className="text-3xl font-bold text-blue-900 mb-6 uppercase">
                {c.t5}
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                {c.t6}
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                {c.t7}
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                {c.t8}
              </p>
            </div>
            <div className="lg:w-1/2 animate-on-scroll opacity-0 transform translate-y-8 transition-all duration-700 delay-300">
              <div className="relative rounded-xl overflow-hidden shadow-xl">
                <img src={c.img2} alt="China-Bangladesh cooperation" className="w-full h-auto" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-900/80 to-transparent p-6">
                  <div className="text-white">
                    <h3 className="text-xl font-bold">
                      {c.t9}
                    </h3>
                    <p className="text-white/80">
                      {c.t10}
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-blue-50 p-4 rounded-lg flex flex-col items-center justify-center text-center">
                  <div className="text-xl font-bold text-blue-900">
                    {c.t11}
                  </div>
                  <div className="text-sm text-gray-600">
                    {c.t12}
                  </div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg flex flex-col items-center justify-center text-center">
                  <div className="text-xl font-bold text-orange-500">
                    {c.t13}
                  </div>
                  <div className="text-sm text-gray-600">
                    {c.t14}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="investment-stats" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-blue-900 mb-8 text-center uppercase">
            {c.t15}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 text-center transform transition-all hover:scale-105 hover:shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-dollar-sign w-12 h-12 mx-auto mb-4 text-blue-900 opacity-80">
                <line x1="12" x2="12" y1="2" y2="22" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <div className="text-4xl font-bold text-blue-900 mb-2">
                {c.t16}
                {c.t17}
                {c.t18}
              </div>
              <div className="text-gray-600">
                {c.t19}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center transform transition-all hover:scale-105 hover:shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-building w-12 h-12 mx-auto mb-4 text-orange-500 opacity-80">
                <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
                <path d="M9 22v-4h6v4" />
                <path d="M8 6h.01" />
                <path d="M16 6h.01" />
                <path d="M12 6h.01" />
                <path d="M12 10h.01" />
                <path d="M12 14h.01" />
                <path d="M16 10h.01" />
                <path d="M16 14h.01" />
                <path d="M8 10h.01" />
                <path d="M8 14h.01" />
              </svg>
              <div className="text-4xl font-bold text-orange-500 mb-2">
                {c.t20}
                {c.t21}
              </div>
              <div className="text-gray-600">
                {c.t22}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center transform transition-all hover:scale-105 hover:shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-briefcase w-12 h-12 mx-auto mb-4 text-blue-900 opacity-80">
                <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                <rect width="20" height="14" x="2" y="6" rx="2" />
              </svg>
              <div className="text-4xl font-bold text-blue-900 mb-2">
                {c.t23}
                {c.t24}
              </div>
              <div className="text-gray-600">
                {c.t25}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="contributions" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-blue-900 mb-2 text-center uppercase">
            {c.t26}
          </h2>
          <p className="text-gray-600 mb-16 text-center max-w-3xl mx-auto">
            {c.t27}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 cursor-pointer">
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all border border-gray-100">
              <div className="p-6">
                <div className="mb-6 flex items-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center bg-blue-900/10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-dollar-sign h-8 w-8 text-blue-900">
                      <line x1="12" x2="12" y1="2" y2="22" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-blue-900 ml-4">
                    {c.t28}
                  </h3>
                </div>
                <p className="text-gray-700 mb-6">
                  {c.t29}
                </p>
                <div className="mt-4 pt-4 border-t border-gray-100 hidden transition-all">
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check mr-2 mt-1 flex-shrink-0 text-blue-900">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span className="text-gray-700 text-sm">
                        {c.t30}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check mr-2 mt-1 flex-shrink-0 text-blue-900">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span className="text-gray-700 text-sm">
                        {c.t31}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check mr-2 mt-1 flex-shrink-0 text-blue-900">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span className="text-gray-700 text-sm">
                        {c.t32}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check mr-2 mt-1 flex-shrink-0 text-blue-900">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span className="text-gray-700 text-sm">
                        {c.t33}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all border border-gray-100">
              <div className="p-6">
                <div className="mb-6 flex items-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center bg-orange-500/10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-git-branch h-8 w-8 text-orange-500">
                      <line x1="6" x2="6" y1="3" y2="15" />
                      <circle cx="18" cy="6" r="3" />
                      <circle cx="6" cy="18" r="3" />
                      <path d="M18 9a9 9 0 0 1-9 9" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-blue-900 ml-4">
                    {c.t34}
                  </h3>
                </div>
                <p className="text-gray-700 mb-6">
                  {c.t35}
                </p>
                <div className="mt-4 pt-4 border-t border-gray-100 hidden transition-all">
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check mr-2 mt-1 flex-shrink-0 text-orange-500">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span className="text-gray-700 text-sm">
                        {c.t36}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check mr-2 mt-1 flex-shrink-0 text-orange-500">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span className="text-gray-700 text-sm">
                        {c.t37}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check mr-2 mt-1 flex-shrink-0 text-orange-500">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span className="text-gray-700 text-sm">
                        {c.t38}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check mr-2 mt-1 flex-shrink-0 text-orange-500">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span className="text-gray-700 text-sm">
                        {c.t39}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all border border-gray-100">
              <div className="p-6">
                <div className="mb-6 flex items-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center bg-blue-900/10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-building h-8 w-8 text-blue-900">
                      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
                      <path d="M9 22v-4h6v4" />
                      <path d="M8 6h.01" />
                      <path d="M16 6h.01" />
                      <path d="M12 6h.01" />
                      <path d="M12 10h.01" />
                      <path d="M12 14h.01" />
                      <path d="M16 10h.01" />
                      <path d="M16 14h.01" />
                      <path d="M8 10h.01" />
                      <path d="M8 14h.01" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-blue-900 ml-4">
                    {c.t40}
                  </h3>
                </div>
                <p className="text-gray-700 mb-6">
                  {c.t41}
                </p>
                <div className="mt-4 pt-4 border-t border-gray-100 hidden transition-all">
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check mr-2 mt-1 flex-shrink-0 text-blue-900">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span className="text-gray-700 text-sm">
                        {c.t42}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check mr-2 mt-1 flex-shrink-0 text-blue-900">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span className="text-gray-700 text-sm">
                        {c.t43}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check mr-2 mt-1 flex-shrink-0 text-blue-900">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span className="text-gray-700 text-sm">
                        {c.t44}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check mr-2 mt-1 flex-shrink-0 text-blue-900">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span className="text-gray-700 text-sm">
                        {c.t45}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all border border-gray-100">
              <div className="p-6">
                <div className="mb-6 flex items-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center bg-orange-500/10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-book-open h-8 w-8 text-orange-500">
                      <path d="M12 7v14" />
                      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-blue-900 ml-4">
                    {c.t46}
                  </h3>
                </div>
                <p className="text-gray-700 mb-6">
                  {c.t47}
                </p>
                <div className="mt-4 pt-4 border-t border-gray-100 hidden transition-all">
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check mr-2 mt-1 flex-shrink-0 text-orange-500">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span className="text-gray-700 text-sm">
                        {c.t48}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check mr-2 mt-1 flex-shrink-0 text-orange-500">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span className="text-gray-700 text-sm">
                        {c.t49}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check mr-2 mt-1 flex-shrink-0 text-orange-500">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span className="text-gray-700 text-sm">
                        {c.t50}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check mr-2 mt-1 flex-shrink-0 text-orange-500">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span className="text-gray-700 text-sm">
                        {c.t51}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all border border-gray-100">
              <div className="p-6">
                <div className="mb-6 flex items-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center bg-blue-900/10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe h-8 w-8 text-blue-900">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                      <path d="M2 12h20" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-blue-900 ml-4">
                    {c.t52}
                  </h3>
                </div>
                <p className="text-gray-700 mb-6">
                  {c.t53}
                </p>
                <div className="mt-4 pt-4 border-t border-gray-100 hidden transition-all">
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check mr-2 mt-1 flex-shrink-0 text-blue-900">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span className="text-gray-700 text-sm">
                        {c.t54}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check mr-2 mt-1 flex-shrink-0 text-blue-900">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span className="text-gray-700 text-sm">
                        {c.t55}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check mr-2 mt-1 flex-shrink-0 text-blue-900">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span className="text-gray-700 text-sm">
                        {c.t56}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check mr-2 mt-1 flex-shrink-0 text-blue-900">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span className="text-gray-700 text-sm">
                        {c.t57}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all border border-gray-100">
              <div className="p-6">
                <div className="mb-6 flex items-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center bg-orange-500/10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users h-8 w-8 text-orange-500">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-blue-900 ml-4">
                    {c.t58}
                  </h3>
                </div>
                <p className="text-gray-700 mb-6">
                  {c.t59}
                </p>
                <div className="mt-4 pt-4 border-t border-gray-100 hidden transition-all">
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check mr-2 mt-1 flex-shrink-0 text-orange-500">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span className="text-gray-700 text-sm">
                        {c.t60}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check mr-2 mt-1 flex-shrink-0 text-orange-500">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span className="text-gray-700 text-sm">
                        {c.t61}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check mr-2 mt-1 flex-shrink-0 text-orange-500">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span className="text-gray-700 text-sm">
                        {c.t62}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check mr-2 mt-1 flex-shrink-0 text-orange-500">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      <span className="text-gray-700 text-sm">
                        {c.t63}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 bg-blue-50" id="technology">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-blue-900 mb-2 text-center uppercase">
              {c.t64}
            </h2>
            <p className="text-gray-600 mb-12 text-center">
              {c.t65}
            </p>
            <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
              <div className="flex flex-col md:flex-row gap-8 items-center mb-8">
                <div className="md:w-1/3">
                  <div className="rounded-xl overflow-hidden">
                    <img src={c.img3} alt="Semi-rigid pavement construction" className="w-full h-auto" />
                  </div>
                </div>
                <div className="md:w-2/3">
                  <h3 className="text-2xl font-bold text-blue-900 mb-4">
                    {c.t66}
                  </h3>
                  <p className="text-gray-700 mb-4">
                    {c.t67}
                  </p>
                  <p className="text-gray-700">
                    {c.t68}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="font-bold text-blue-900 mb-3">
                  {c.t69}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-blue-900/10 flex items-center justify-center flex-shrink-0 mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check h-5 w-5 text-blue-900">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-800">
                        {c.t70}
                      </h5>
                      <p className="text-sm text-gray-600">
                        {c.t71}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-blue-900/10 flex items-center justify-center flex-shrink-0 mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check h-5 w-5 text-blue-900">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-800">
                        {c.t72}
                      </h5>
                      <p className="text-sm text-gray-600">
                        {c.t73}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-blue-900/10 flex items-center justify-center flex-shrink-0 mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check h-5 w-5 text-blue-900">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-800">
                        {c.t74}
                      </h5>
                      <p className="text-sm text-gray-600">
                        {c.t75}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-blue-900/10 flex items-center justify-center flex-shrink-0 mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check h-5 w-5 text-blue-900">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-800">
                        {c.t76}
                      </h5>
                      <p className="text-sm text-gray-600">
                        {c.t77}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-gray-700 italic mb-6">
                {c.t78}
              </p>
              <p className="text-blue-900 font-medium">
                {c.t79}
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 bg-white" id="bri">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="lg:w-1/2">
              <div className="relative rounded-xl overflow-hidden shadow-xl">
                <img src={c.img4} alt="Belt and Road Initiative" className="w-full h-auto" />
                <div className="absolute top-4 left-4 bg-blue-900/80 text-white text-sm font-bold px-3 py-1 rounded-full backdrop-blur-sm">
                  {c.t80}
                </div>
              </div>
            </div>
            <div className="lg:w-1/2">
              <h2 className="text-3xl font-bold text-blue-900 mb-6 uppercase">
                {c.t81}
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                {c.t82}
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                {c.t83}
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                {c.t84}
              </p>
              <div className="bg-blue-50 p-6 rounded-lg">
                <h4 className="font-bold text-blue-900 mb-3">
                  {c.t85}
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check text-orange-500 mr-3 mt-0.5 flex-shrink-0">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    <span className="text-gray-700">
                      {c.t86}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check text-orange-500 mr-3 mt-0.5 flex-shrink-0">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    <span className="text-gray-700">
                      {c.t87}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check text-orange-500 mr-3 mt-0.5 flex-shrink-0">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    <span className="text-gray-700">
                      {c.t88}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check text-orange-500 mr-3 mt-0.5 flex-shrink-0">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    <span className="text-gray-700">
                      {c.t89}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 bg-gray-50" id="knowledge">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-blue-900 mb-2 text-center uppercase">
            {c.t90}
          </h2>
          <p className="text-gray-600 mb-16 text-center max-w-3xl mx-auto">
            {c.t91}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <h3 className="text-xl font-bold text-blue-900 mb-4">
                  {c.t92}
                </h3>
                <p className="text-gray-700 mb-4">
                  {c.t93}
                </p>
                <p className="text-gray-700">
                  {c.t94}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-bold text-blue-900 mb-4">
                  {c.t95}
                </h3>
                <p className="text-gray-700 mb-4">
                  {c.t96}
                </p>
                <p className="text-gray-700">
                  {c.t97}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="w-16 h-16 bg-blue-900/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users h-8 w-8 text-blue-900">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">
                  {c.t98}
                  {c.t99}
                </div>
                <div className="text-gray-600">
                  {c.t100}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-book-open h-8 w-8 text-orange-500">
                    <path d="M12 7v14" />
                    <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-orange-500 mb-2">
                  {c.t101}
                </div>
                <div className="text-gray-600">
                  {c.t102}
                </div>
              </div>
              <div className="col-span-2 bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-award h-6 w-6 text-blue-900 mr-3">
                    <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" />
                    <circle cx="12" cy="8" r="6" />
                  </svg>
                  <h4 className="font-bold text-blue-900">
                    {c.t103}
                  </h4>
                </div>
                <p className="text-gray-700 text-sm">
                  {c.t104}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 bg-white" id="csr">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-blue-900 mb-2 text-center uppercase">
            {c.t105}
          </h2>
          <p className="text-gray-600 mb-16 text-center max-w-3xl mx-auto">
            {c.t106}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all">
              <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url('${c.img5}')` }} />
              <div className="p-6">
                <h3 className="text-xl font-bold text-blue-900 mb-3">
                  {c.t107}
                </h3>
                <p className="text-gray-700 mb-4">
                  {c.t108}
                </p>
                <div className="pt-4 border-t border-gray-100">
                  <div className="text-sm text-blue-900 font-medium">
                    {c.t109}
                  </div>
                  <div className="text-sm text-gray-700">
                    {c.t110}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all">
              <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url('${c.img6}')` }} />
              <div className="p-6">
                <h3 className="text-xl font-bold text-blue-900 mb-3">
                  {c.t111}
                </h3>
                <p className="text-gray-700 mb-4">
                  {c.t112}
                </p>
                <div className="pt-4 border-t border-gray-100">
                  <div className="text-sm text-blue-900 font-medium">
                    {c.t113}
                  </div>
                  <div className="text-sm text-gray-700">
                    {c.t114}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all">
              <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url('${c.img7}')` }} />
              <div className="p-6">
                <h3 className="text-xl font-bold text-blue-900 mb-3">
                  {c.t115}
                </h3>
                <p className="text-gray-700 mb-4">
                  {c.t116}
                </p>
                <div className="pt-4 border-t border-gray-100">
                  <div className="text-sm text-blue-900 font-medium">
                    {c.t117}
                  </div>
                  <div className="text-sm text-gray-700">
                    {c.t118}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 bg-blue-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            {c.t119}
          </h2>
          <p className="text-lg text-white/80 max-w-3xl mx-auto mb-8">
            {c.t120}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="/stakeholders" className="bg-white text-blue-900 hover:bg-gray-100 px-8 py-3 rounded-md transition-all">
              {c.t121}
            </a>
            <a href="/project/overview" className="bg-orange-500 hover:bg-orange-400 text-white px-8 py-3 rounded-md transition-all">
              {c.t122}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
