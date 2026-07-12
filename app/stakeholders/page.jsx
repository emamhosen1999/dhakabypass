import { getContent } from '../../lib/content';

export const dynamic = 'force-dynamic';

/**
 * stakeholders — reconstructed from the original site's live DOM.
 * All copy and imagery comes from content key "page.stakeholders" so the admin
 * panel can edit every field.
 */
export default async function StakeholdersPage() {
  const c = await getContent('page.stakeholders');
  return (
    <>
      <section className="relative py-20 bg-gradient-to-r from-blue-900 to-blue-800">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url('${c.img1}')` }} />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h1 className="text-4xl font-bold mb-4 uppercase">
              {c.t1}
            </h1>
            <p className="text-xl opacity-90 mb-8">
              {c.t2}
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <button className="px-6 py-3 rounded-md transition-all bg-orange-500 text-white">
                {c.t3}
              </button>
              <button className="px-6 py-3 rounded-md transition-all bg-white/10 text-white hover:bg-white/20">
                {c.t4}
              </button>
              <button className="px-6 py-3 rounded-md transition-all bg-white/10 text-white hover:bg-white/20">
                {c.t5}
              </button>
              <button className="px-6 py-3 rounded-md transition-all bg-white/10 text-white hover:bg-white/20">
                {c.t6}
              </button>
            </div>
          </div>
        </div>
      </section>
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto mb-16 text-center">
          <p className="text-lg text-gray-700 mb-6">
            {c.t7}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="bg-blue-50 p-4 rounded-lg flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-900/10 flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-award w-5 h-5 text-blue-900">
                  <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" />
                  <circle cx="12" cy="8" r="6" />
                </svg>
              </div>
              <div className="text-sm">
                <div className="font-semibold">
                  {c.t8}
                </div>
                <div className="text-gray-600">
                  {c.t9}
                </div>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-900/10 flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users w-5 h-5 text-blue-900">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="text-sm">
                <div className="font-semibold">
                  {c.t10}
                </div>
                <div className="text-gray-600">
                  {c.t11}
                </div>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-900/10 flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-building w-5 h-5 text-blue-900">
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
              <div className="text-sm">
                <div className="font-semibold">
                  {c.t12}
                </div>
                <div className="text-gray-600">
                  {c.t13}
                </div>
              </div>
            </div>
          </div>
        </div>
        <section id="bangladeshi" className="mb-24">
          <div className="border-b border-orange-500 mb-8">
            <h2 className="text-3xl font-bold text-blue-900 mb-2 uppercase">
              {c.t14}
            </h2>
          </div>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-12">
            <div className="md:flex">
              <div className="md:w-1/3 bg-blue-900 text-white p-8">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-building w-8 h-8 text-white">
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
                  <div className="ml-4">
                    <h3 className="text-xl font-bold">
                      {c.t15}
                    </h3>
                    <p className="text-sm text-white/80">
                      {c.t16}
                    </p>
                  </div>
                </div>
                <div className="space-y-4 mt-8">
                  <div className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-orange-500 flex-shrink-0 flex items-center justify-center mt-0.5 mr-3">
                      <span className="text-white text-xs font-bold">
                        {c.t17}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {c.t18}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-orange-500 flex-shrink-0 flex items-center justify-center mt-0.5 mr-3">
                      <span className="text-white text-xs font-bold">
                        {c.t19}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {c.t20}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-orange-500 flex-shrink-0 flex items-center justify-center mt-0.5 mr-3">
                      <span className="text-white text-xs font-bold">
                        {c.t21}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {c.t22}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-8">
                  <a href="https://www.scrbg.com/outportal_en/index.html" target="_blank" className="inline-flex items-center text-white border border-white/40 px-4 py-2 rounded-md hover:bg-white/10 transition-all">
                    {c.t23}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right ml-2">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
              <div className="md:w-2/3 p-8">
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {c.t24}
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {c.t25}
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {c.t26}
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    {c.t27}
                  </p>
                </div>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe w-5 h-5 text-blue-900 mr-3">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                      <path d="M2 12h20" />
                    </svg>
                    <span className="text-gray-700">
                      {c.t28}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users w-5 h-5 text-blue-900 mr-3">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span className="text-gray-700">
                      {c.t29}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link w-5 h-5 text-blue-900 mr-3">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    <span className="text-gray-700">
                      {c.t30}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-briefcase w-5 h-5 text-blue-900 mr-3">
                      <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      <rect width="20" height="14" x="2" y="6" rx="2" />
                    </svg>
                    <span className="text-gray-700">
                      {c.t31}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-12">
            <div className="md:flex flex-row-reverse">
              <div className="md:w-1/3 bg-orange-500 text-white p-8">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-building w-8 h-8 text-white">
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
                  <div className="ml-4">
                    <h3 className="text-xl font-bold">
                      {c.t32}
                    </h3>
                    <p className="text-sm text-white/80">
                      {c.t33}
                    </p>
                  </div>
                </div>
                <div className="space-y-4 mt-8">
                  <div className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-blue-900 flex-shrink-0 flex items-center justify-center mt-0.5 mr-3">
                      <span className="text-white text-xs font-bold">
                        {c.t34}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {c.t35}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-blue-900 flex-shrink-0 flex items-center justify-center mt-0.5 mr-3">
                      <span className="text-white text-xs font-bold">
                        {c.t36}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {c.t37}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-blue-900 flex-shrink-0 flex items-center justify-center mt-0.5 mr-3">
                      <span className="text-white text-xs font-bold">
                        {c.t38}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {c.t39}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-8">
                  <a href="" className="inline-flex items-center text-white border border-white/40 px-4 py-2 rounded-md hover:bg-white/10 transition-all">
                    {c.t40}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right ml-2">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
              <div className="md:w-2/3 p-8">
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {c.t41}
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {c.t42}
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    {c.t43}
                  </p>
                </div>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe w-5 h-5 text-orange-500 mr-3">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                      <path d="M2 12h20" />
                    </svg>
                    <span className="text-gray-700">
                      {c.t44}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users w-5 h-5 text-orange-500 mr-3">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span className="text-gray-700">
                      {c.t45}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link w-5 h-5 text-orange-500 mr-3">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    <span className="text-gray-700">
                      {c.t46}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-briefcase w-5 h-5 text-orange-500 mr-3">
                      <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      <rect width="20" height="14" x="2" y="6" rx="2" />
                    </svg>
                    <span className="text-gray-700">
                      {c.t47}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-12">
            <div className="md:flex">
              <div className="md:w-1/3 bg-blue-900 text-white p-8">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-building w-8 h-8 text-white">
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
                  <div className="ml-4">
                    <h3 className="text-xl font-bold">
                      {c.t48}
                    </h3>
                    <p className="text-sm text-white/80">
                      {c.t49}
                    </p>
                  </div>
                </div>
                <div className="space-y-4 mt-8">
                  <div className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-orange-500 flex-shrink-0 flex items-center justify-center mt-0.5 mr-3">
                      <span className="text-white text-xs font-bold">
                        {c.t50}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {c.t51}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-orange-500 flex-shrink-0 flex items-center justify-center mt-0.5 mr-3">
                      <span className="text-white text-xs font-bold">
                        {c.t52}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {c.t53}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-orange-500 flex-shrink-0 flex items-center justify-center mt-0.5 mr-3">
                      <span className="text-white text-xs font-bold">
                        {c.t54}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {c.t55}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-8">
                  <a href="http://udccl.com.bd/" target="_blank" className="inline-flex items-center text-white border border-white/40 px-4 py-2 rounded-md hover:bg-white/10 transition-all">
                    {c.t56}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right ml-2">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
              <div className="md:w-2/3 p-8">
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {c.t57}
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {c.t58}
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    {c.t59}
                  </p>
                </div>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe w-5 h-5 text-blue-900 mr-3">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                      <path d="M2 12h20" />
                    </svg>
                    <span className="text-gray-700">
                      {c.t60}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users w-5 h-5 text-blue-900 mr-3">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span className="text-gray-700">
                      {c.t61}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link w-5 h-5 text-blue-900 mr-3">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    <span className="text-gray-700">
                      {c.t62}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-briefcase w-5 h-5 text-blue-900 mr-3">
                      <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      <rect width="20" height="14" x="2" y="6" rx="2" />
                    </svg>
                    <span className="text-gray-700">
                      {c.t63}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="international" className="mb-24">
          <div className="border-b border-orange-500 mb-8">
            <h2 className="text-3xl font-bold text-blue-900 mb-2 uppercase">
              {c.t64}
            </h2>
            <p className="text-gray-600 mb-6">
              {c.t65}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-12">
            <div className="md:flex flex-row-reverse">
              <div className="md:w-1/3 bg-orange-500 text-white p-8">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-building w-8 h-8 text-white">
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
                  <div className="ml-4">
                    <h3 className="text-xl font-bold">
                      {c.t66}
                    </h3>
                    <p className="text-sm text-white/80">
                      {c.t67}
                    </p>
                  </div>
                </div>
                <div className="space-y-4 mt-8">
                  <div className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-blue-900 flex-shrink-0 flex items-center justify-center mt-0.5 mr-3">
                      <span className="text-white text-xs font-bold">
                        {c.t68}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {c.t69}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-blue-900 flex-shrink-0 flex items-center justify-center mt-0.5 mr-3">
                      <span className="text-white text-xs font-bold">
                        {c.t70}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {c.t71}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-blue-900 flex-shrink-0 flex items-center justify-center mt-0.5 mr-3">
                      <span className="text-white text-xs font-bold">
                        {c.t72}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {c.t73}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-8">
                  <a href="https://www.pppo.gov.bd/" target="_blank" className="inline-flex items-center text-white border border-white/40 px-4 py-2 rounded-md hover:bg-white/10 transition-all">
                    {c.t74}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right ml-2">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
              <div className="md:w-2/3 p-8">
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {c.t75}
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {c.t76}
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    {c.t77}
                  </p>
                </div>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe w-5 h-5 text-orange-500 mr-3">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                      <path d="M2 12h20" />
                    </svg>
                    <span className="text-gray-700">
                      {c.t78}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users w-5 h-5 text-orange-500 mr-3">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span className="text-gray-700">
                      {c.t79}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link w-5 h-5 text-orange-500 mr-3">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    <span className="text-gray-700">
                      {c.t80}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-briefcase w-5 h-5 text-orange-500 mr-3">
                      <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      <rect width="20" height="14" x="2" y="6" rx="2" />
                    </svg>
                    <span className="text-gray-700">
                      {c.t81}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-12">
            <div className="md:flex">
              <div className="md:w-1/3 bg-blue-900 text-white p-8">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-building w-8 h-8 text-white">
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
                  <div className="ml-4">
                    <h3 className="text-xl font-bold">
                      {c.t82}
                    </h3>
                    <p className="text-sm text-white/80">
                      {c.t83}
                    </p>
                  </div>
                </div>
                <div className="space-y-4 mt-8">
                  <div className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-orange-500 flex-shrink-0 flex items-center justify-center mt-0.5 mr-3">
                      <span className="text-white text-xs font-bold">
                        {c.t84}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {c.t85}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-orange-500 flex-shrink-0 flex items-center justify-center mt-0.5 mr-3">
                      <span className="text-white text-xs font-bold">
                        {c.t86}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {c.t87}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-orange-500 flex-shrink-0 flex items-center justify-center mt-0.5 mr-3">
                      <span className="text-white text-xs font-bold">
                        {c.t88}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {c.t89}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-8">
                  <a href="https://www.rhd.gov.bd/RHDAtGlance/index.asp" target="_blank" className="inline-flex items-center text-white border border-white/40 px-4 py-2 rounded-md hover:bg-white/10 transition-all">
                    {c.t90}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right ml-2">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
              <div className="md:w-2/3 p-8">
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {c.t91}
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {c.t92}
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {c.t93}
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    {c.t94}
                  </p>
                </div>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe w-5 h-5 text-blue-900 mr-3">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                      <path d="M2 12h20" />
                    </svg>
                    <span className="text-gray-700">
                      {c.t95}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users w-5 h-5 text-blue-900 mr-3">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span className="text-gray-700">
                      {c.t96}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link w-5 h-5 text-blue-900 mr-3">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    <span className="text-gray-700">
                      {c.t97}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-briefcase w-5 h-5 text-blue-900 mr-3">
                      <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      <rect width="20" height="14" x="2" y="6" rx="2" />
                    </svg>
                    <span className="text-gray-700">
                      {c.t98}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="chinese" className="mb-24">
          <div className="border-b border-orange-500 mb-8">
            <h2 className="text-3xl font-bold text-blue-900 mb-2 uppercase">
              {c.t99}
            </h2>
            <p className="text-gray-600 mb-6">
              {c.t100}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="md:flex flex-row-reverse">
              <div className="md:w-2/3 p-8">
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {c.t101}
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {c.t102}
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    {c.t103}
                  </p>
                </div>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe w-5 h-5 text-orange-500 mr-3">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                      <path d="M2 12h20" />
                    </svg>
                    <span className="text-gray-700">
                      {c.t104}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link w-5 h-5 text-orange-500 mr-3">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    <span className="text-gray-700">
                      {c.t105}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-briefcase w-5 h-5 text-orange-500 mr-3">
                      <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      <rect width="20" height="14" x="2" y="6" rx="2" />
                    </svg>
                    <span className="text-gray-700">
                      {c.t106}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users w-5 h-5 text-orange-500 mr-3">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span className="text-gray-700">
                      {c.t107}
                    </span>
                  </div>
                </div>
              </div>
              <div className="md:w-1/3 bg-blue-900 text-white p-8">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-building w-8 h-8 text-white">
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
                  <div className="ml-4">
                    <h3 className="text-xl font-bold">
                      {c.t108}
                    </h3>
                    <p className="text-sm text-white/80">
                      {c.t109}
                    </p>
                  </div>
                </div>
                <div className="space-y-4 mt-8">
                  <div className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-blue-900 flex-shrink-0 flex items-center justify-center mt-0.5 mr-3">
                      <span className="text-white text-xs font-bold">
                        {c.t110}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {c.t111}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-blue-900 flex-shrink-0 flex items-center justify-center mt-0.5 mr-3">
                      <span className="text-white text-xs font-bold">
                        {c.t112}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {c.t113}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-blue-900 flex-shrink-0 flex items-center justify-center mt-0.5 mr-3">
                      <span className="text-white text-xs font-bold">
                        {c.t114}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {c.t115}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-8">
                  <a href="https://www.cdb.com.cn/English/" target="_blank" className="inline-flex items-center text-white border border-white/40 px-4 py-2 rounded-md hover:bg-white/10 transition-all">
                    {c.t116}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right ml-2">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md overflow-hidden mt-10">
            <div className="md:flex flex-row-reverse">
              <div className="md:w-1/3 bg-orange-500 text-white p-8">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-building w-8 h-8 text-white">
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
                  <div className="ml-4">
                    <h3 className="text-xl font-bold">
                      {c.t117}
                    </h3>
                    <p className="text-sm text-white/80">
                      {c.t118}
                    </p>
                  </div>
                </div>
                <div className="space-y-4 mt-8">
                  <div className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-blue-900 flex-shrink-0 flex items-center justify-center mt-0.5 mr-3">
                      <span className="text-white text-xs font-bold">
                        {c.t119}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {c.t120}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-blue-900 flex-shrink-0 flex items-center justify-center mt-0.5 mr-3">
                      <span className="text-white text-xs font-bold">
                        {c.t121}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {c.t122}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-blue-900 flex-shrink-0 flex items-center justify-center mt-0.5 mr-3">
                      <span className="text-white text-xs font-bold">
                        {c.t123}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {c.t124}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-8">
                  <a href="https://www.biffl.org.bd/" target="_blank" className="inline-flex items-center text-white border border-white/40 px-4 py-2 rounded-md hover:bg-white/10 transition-all">
                    {c.t125}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right ml-2">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
              <div className="md:w-2/3 p-8">
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {c.t126}
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {c.t127}
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    {c.t128}
                  </p>
                </div>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe w-5 h-5 text-orange-500 mr-3">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                      <path d="M2 12h20" />
                    </svg>
                    <span className="text-gray-700">
                      {c.t129}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users w-5 h-5 text-orange-500 mr-3">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span className="text-gray-700">
                      {c.t130}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link w-5 h-5 text-orange-500 mr-3">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    <span className="text-gray-700">
                      {c.t131}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-briefcase w-5 h-5 text-orange-500 mr-3">
                      <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      <rect width="20" height="14" x="2" y="6" rx="2" />
                    </svg>
                    <span className="text-gray-700">
                      {c.t132}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="team" className="mb-24">
          <div className="border-b border-orange-500 mb-8">
            <h2 className="text-3xl font-bold text-blue-900 mb-2 uppercase">
              {c.t133}
            </h2>
            <p className="text-gray-600 mb-6">
              {c.t134}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-md overflow-hidden transform transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="h-48 bg-orange-500 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users w-12 h-12 text-white">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-1">
                  {c.t135}
                </h3>
                <p className="text-blue-900 font-medium mb-4">
                  {c.t136}
                </p>
                <p className="text-gray-600 mb-4">
                  {c.t137}
                </p>
                <div className="flex items-center text-gray-700 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-building w-4 h-4 mr-2">
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
                  <span className="text-sm">
                    {c.t138}
                  </span>
                </div>
                <div className="flex items-center text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail w-4 h-4 mr-2">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <span className="text-sm">
                    {c.t139}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md overflow-hidden transform transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="h-48 bg-blue-900 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users w-12 h-12 text-white">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-1">
                  {c.t140}
                </h3>
                <p className="text-orange-500 font-medium mb-4">
                  {c.t141}
                </p>
                <p className="text-gray-600 mb-4">
                  {c.t142}
                </p>
                <div className="flex items-center text-gray-700 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-building w-4 h-4 mr-2">
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
                  <span className="text-sm">
                    {c.t143}
                  </span>
                </div>
                <div className="flex items-center text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail w-4 h-4 mr-2">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <span className="text-sm">
                    {c.t144}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md overflow-hidden transform transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="h-48 bg-orange-500 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users w-12 h-12 text-white">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-1">
                  {c.t145}
                </h3>
                <p className="text-blue-900 font-medium mb-4">
                  {c.t146}
                </p>
                <p className="text-gray-600 mb-4">
                  {c.t147}
                </p>
                <div className="flex items-center text-gray-700 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-building w-4 h-4 mr-2">
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
                  <span className="text-sm">
                    {c.t148}
                  </span>
                </div>
                <div className="flex items-center text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail w-4 h-4 mr-2">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <span className="text-sm">
                    {c.t149}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-8 mt-12">
            <h3 className="text-xl font-bold text-blue-900 mb-4 uppercase">
              {c.t150}
            </h3>
            <p className="text-gray-700 mb-6">
              {c.t151}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h4 className="font-bold text-blue-900 mb-3">
                  {c.t152}
                </h4>
                <p className="text-gray-600 text-sm mb-4">
                  {c.t153}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h4 className="font-bold text-blue-900 mb-3">
                  {c.t154}
                </h4>
                <p className="text-gray-600 text-sm mb-4">
                  {c.t155}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h4 className="font-bold text-blue-900 mb-3">
                  {c.t156}
                </h4>
                <p className="text-gray-600 text-sm mb-4">
                  {c.t157}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <section className="py-16 bg-blue-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            {c.t158}
          </h2>
          <p className="text-lg text-white/80 max-w-3xl mx-auto mb-8">
            {c.t159}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="/project" className="bg-white text-blue-900 hover:bg-gray-100 px-8 py-3 rounded-md transition-all">
              {c.t160}
            </a>
            <a href="/contact" className="bg-orange-500 hover:bg-orange-400 text-white px-8 py-3 rounded-md transition-all">
              {c.t161}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
