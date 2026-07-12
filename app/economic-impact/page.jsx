import { getContent } from '../../lib/content';

export const dynamic = 'force-dynamic';

/**
 * economic-impact — reconstructed from the original site's live DOM.
 * All copy and imagery comes from content key "page.economic-impact" so the admin
 * panel can edit every field.
 */
export default async function EconomicImpactPage() {
  const c = await getContent('page.economic-impact');
  return (
    <>
      <div className="relative h-[50vh] md:h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-blue-700 opacity-90" />
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${c.img1}')` }} />
        <div className="container mx-auto px-4 z-10 text-center">
          <div className="text-white">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 uppercase">
              {c.t1}
            </h1>
            <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto">
              {c.t2}
            </p>
          </div>
        </div>
      </div>
      <section id="economic-impact" className="py-16 in-view">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-blue-900 mb-6 uppercase">
              {c.t3}
            </h2>
            <p className="text-gray-700 mb-8 leading-relaxed">
              {c.t4}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
            <div className="bg-blue-900 text-white p-8 rounded-lg text-center transform transition-all hover:scale-105">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up text-white">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                  <polyline points="16 7 22 7 22 13" />
                </svg>
              </div>
              <div className="text-3xl font-bold mb-2">
                {c.t5}
                {c.t6}
              </div>
              <div className="text-sm text-white/80">
                {c.t7}
              </div>
            </div>
            <div className="bg-orange-500 text-white p-8 rounded-lg text-center transform transition-all hover:scale-105">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock text-white">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="text-3xl font-bold mb-2">
                {c.t8}
                {c.t9}
              </div>
              <div className="text-sm text-white/80">
                {c.t10}
              </div>
            </div>
            <div className="bg-blue-900 text-white p-8 rounded-lg text-center transform transition-all hover:scale-105">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users text-white">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="text-3xl font-bold mb-2">
                {c.t11}
                {c.t12}
              </div>
              <div className="text-sm text-white/80">
                {c.t13}
              </div>
            </div>
            <div className="bg-orange-500 text-white p-8 rounded-lg text-center transform transition-all hover:scale-105">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-dollar-sign text-white">
                  <line x1="12" x2="12" y1="2" y2="22" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="text-3xl font-bold mb-2">
                {c.t14}
                <span>
                  {c.t15}
                </span>
                {c.t16}
              </div>
              <div className="text-sm text-white/80">
                {c.t17}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="trade-commerce" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-blue-900 mb-6 uppercase">
                {c.t18}
              </h2>
              <p className="text-gray-700 mb-6 leading-relaxed">
                {c.t19}
              </p>
              <p className="text-gray-700 mb-6 leading-relaxed">
                {c.t20}
              </p>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-blue-900 mb-4">
                  {c.t21}
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up text-orange-500 mr-3 mt-1 flex-shrink-0">
                      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                      <polyline points="16 7 22 7 22 13" />
                    </svg>
                    <span className="text-gray-700">
                      {c.t22}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock text-orange-500 mr-3 mt-1 flex-shrink-0">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="text-gray-700">
                      {c.t23}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe text-orange-500 mr-3 mt-1 flex-shrink-0">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                      <path d="M2 12h20" />
                    </svg>
                    <span className="text-gray-700">
                      {c.t24}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="bg-blue-900 text-white rounded-xl p-8 shadow-xl">
              <h3 className="text-2xl font-bold mb-6">
                {c.t25}
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>
                      {c.t26}
                    </span>
                    <span className="font-bold">
                      {c.t27}
                    </span>
                  </div>
                  <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: "65%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>
                      {c.t28}
                    </span>
                    <span className="font-bold">
                      {c.t29}
                    </span>
                  </div>
                  <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: "42%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>
                      {c.t30}
                    </span>
                    <span className="font-bold">
                      {c.t31}
                    </span>
                  </div>
                  <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: "85%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>
                      {c.t32}
                    </span>
                    <span className="font-bold">
                      {c.t33}
                    </span>
                  </div>
                  <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: "60%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="employment" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold text-blue-900 mb-6 uppercase">
              {c.t34}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {c.t35}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-gray-50 rounded-lg p-6 shadow-md hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-blue-900/10 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users text-blue-900">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-blue-900 mb-3">
                {c.t36}
              </h3>
              <p className="text-gray-700 mb-4">
                {c.t37}
              </p>
              <div className="text-4xl font-bold text-orange-500">
                {c.t38}
              </div>
              <div className="text-sm text-gray-500">
                {c.t39}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 shadow-md hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-blue-900/10 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-briefcase text-blue-900">
                  <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  <rect width="20" height="14" x="2" y="6" rx="2" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-blue-900 mb-3">
                {c.t40}
              </h3>
              <p className="text-gray-700 mb-4">
                {c.t41}
              </p>
              <div className="text-4xl font-bold text-orange-500">
                {c.t42}
              </div>
              <div className="text-sm text-gray-500">
                {c.t43}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6 shadow-md hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-blue-900/10 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-award text-blue-900">
                  <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" />
                  <circle cx="12" cy="8" r="6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-blue-900 mb-3">
                {c.t44}
              </h3>
              <p className="text-gray-700 mb-4">
                {c.t45}
              </p>
              <div className="text-4xl font-bold text-orange-500">
                {c.t46}
              </div>
              <div className="text-sm text-gray-500">
                {c.t47}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="regional-development" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-blue-900 mb-6 text-center uppercase">
            {c.t48}
          </h2>
          <p className="text-gray-700 mb-16 text-center max-w-3xl mx-auto">
            {c.t49}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-bold text-blue-900 mb-4">
                  {c.t50}
                </h3>
                <p className="text-gray-700 mb-6">
                  {c.t51}
                </p>
                <div className="bg-blue-900/5 p-4 rounded-lg">
                  <h4 className="font-bold text-blue-900 mb-2">
                    {c.t52}
                  </h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-building text-orange-500 mr-2 mt-1 flex-shrink-0">
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
                      <span className="text-gray-700">
                        {c.t53}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-building text-orange-500 mr-2 mt-1 flex-shrink-0">
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
                      <span className="text-gray-700">
                        {c.t54}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-building text-orange-500 mr-2 mt-1 flex-shrink-0">
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
                      <span className="text-gray-700">
                        {c.t55}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-bold text-blue-900 mb-4">
                  {c.t56}
                </h3>
                <p className="text-gray-700 mb-6">
                  {c.t57}
                </p>
                <div className="bg-blue-900/5 p-4 rounded-lg">
                  <h4 className="font-bold text-blue-900 mb-2">
                    {c.t58}
                  </h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right text-orange-500 mr-2 mt-1 flex-shrink-0">
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                      <span className="text-gray-700">
                        {c.t59}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right text-orange-500 mr-2 mt-1 flex-shrink-0">
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                      <span className="text-gray-700">
                        {c.t60}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right text-orange-500 mr-2 mt-1 flex-shrink-0">
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                      <span className="text-gray-700">
                        {c.t61}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right text-orange-500 mr-2 mt-1 flex-shrink-0">
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                      <span className="text-gray-700">
                        {c.t62}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 bg-blue-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            {c.t63}
          </h2>
          <p className="text-lg text-white/80 max-w-3xl mx-auto mb-8">
            {c.t64}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="/project" className="bg-white text-blue-900 hover:bg-gray-100 px-8 py-3 rounded-md transition-all">
              {c.t65}
            </a>
            <a href="/routes-facilities" className="bg-orange-500 hover:bg-orange-400 text-white px-8 py-3 rounded-md transition-all">
              {c.t66}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
