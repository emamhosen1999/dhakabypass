import { getContent } from '../../lib/content';

export const dynamic = 'force-dynamic';

/**
 * project — reconstructed from the original site's live DOM.
 * All copy and imagery comes from content key "page.project" so the admin
 * panel can edit every field.
 */
export default async function ProjectPage() {
  const c = await getContent('page.project');
  return (
    <>
      <section className="relative bg-gradient-to-r from-blue-900 to-blue-800 text-white py-16 md:py-24">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url('${c.img1}')` }} />
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-6  uppercase">
              {c.t1}
            </h1>
            <p className="text-xl md:text-2xl opacity-90 mb-8">
              {c.t2}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="#overview" className="bg-white text-blue-900 hover:bg-blue-50 px-6 py-3 rounded-md font-medium transition-all flex items-center">
                {c.t3}
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right ml-2">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </a>
              <button type="button" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-md font-medium transition-all flex items-center cursor-pointer">
                {c.t4}
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin ml-2">
                  <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>
      <section id="overview" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-8 text-center uppercase">
              {c.t5}
            </h2>
            <div className="bg-gray-50 p-6 rounded-xl mb-12">
              <div className="flex items-start">
                <div className="mr-4 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-info text-blue-900">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-blue-900 mb-2">
                    {c.t6}
                  </h3>
                  <p className="text-gray-700 mb-4">
                    {c.t7}
                  </p>
                  <p className="text-gray-700 mb-4">
                    {c.t8}
                  </p>
                  <p className="text-gray-700">
                    {c.t9}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              <div className="bg-white shadow-md rounded-xl overflow-hidden">
                <div className="bg-blue-900 text-white p-4">
                  <h3 className="text-xl font-bold">
                    {c.t10}
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium text-gray-700">
                      {c.t11}
                    </div>
                    <div className="font-bold text-blue-900">
                      {c.t12}
                      {c.t13}
                    </div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-6">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: "69.11%" }} />
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-3">
                    {c.t14}
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-sm text-gray-600">
                          {c.t15}
                        </div>
                        <div className="text-sm font-medium text-gray-800">
                          {c.t16}
                          {c.t17}
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: "93.9%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-sm text-gray-600">
                          {c.t18}
                        </div>
                        <div className="text-sm font-medium text-gray-800">
                          {c.t19}
                          {c.t20}
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: "82.89%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-sm text-gray-600">
                          {c.t21}
                        </div>
                        <div className="text-sm font-medium text-gray-800">
                          {c.t22}
                          {c.t23}
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: "53.95%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-sm text-gray-600">
                          {c.t24}
                        </div>
                        <div className="text-sm font-medium text-gray-800">
                          {c.t25}
                          {c.t26}
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: "100%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-sm text-gray-600">
                          {c.t27}
                        </div>
                        <div className="text-sm font-medium text-gray-800">
                          {c.t28}
                          {c.t29}
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: "90.9%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-sm text-gray-600">
                          {c.t30}
                        </div>
                        <div className="text-sm font-medium text-gray-800">
                          {c.t31}
                          {c.t32}
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: "54.21%" }} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 text-sm text-gray-500 text-right">
                    {c.t33}
                  </div>
                </div>
              </div>
              <div className="bg-white shadow-md rounded-xl overflow-hidden">
                <div className="bg-blue-900 text-white p-4">
                  <h3 className="text-xl font-bold">
                    {c.t34}
                  </h3>
                </div>
                <div className="p-6">
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check-big w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0">
                        <path d="M21.801 10A10 10 0 1 1 17 3.335" />
                        <path d="m9 11 3 3L22 4" />
                      </svg>
                      <div>
                        <span className="font-medium text-gray-800">
                          {c.t35}
                        </span>
                        <p className="text-gray-600 text-sm">
                          {c.t36}
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check-big w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0">
                        <path d="M21.801 10A10 10 0 1 1 17 3.335" />
                        <path d="m9 11 3 3L22 4" />
                      </svg>
                      <div>
                        <span className="font-medium text-gray-800">
                          {c.t37}
                        </span>
                        <p className="text-gray-600 text-sm">
                          {c.t38}
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check-big w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0">
                        <path d="M21.801 10A10 10 0 1 1 17 3.335" />
                        <path d="m9 11 3 3L22 4" />
                      </svg>
                      <div>
                        <span className="font-medium text-gray-800">
                          {c.t39}
                        </span>
                        <p className="text-gray-600 text-sm">
                          {c.t40}
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check-big w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0">
                        <path d="M21.801 10A10 10 0 1 1 17 3.335" />
                        <path d="m9 11 3 3L22 4" />
                      </svg>
                      <div>
                        <span className="font-medium text-gray-800">
                          {c.t41}
                        </span>
                        <p className="text-gray-600 text-sm">
                          {c.t42}
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check-big w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0">
                        <path d="M21.801 10A10 10 0 1 1 17 3.335" />
                        <path d="m9 11 3 3L22 4" />
                      </svg>
                      <div>
                        <span className="font-medium text-gray-800">
                          {c.t43}
                        </span>
                        <p className="text-gray-600 text-sm">
                          {c.t44}
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="mb-16">
              <h3 className="text-2xl font-bold text-blue-900 mb-6 text-center uppercase">
                {c.t45}
              </h3>
              <div className="relative">
                <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-blue-900 via-orange-500 to-blue-900" />
                <div className="space-y-24 relative">
                  <div className="flex items-center justify-end relative opacity-0 translate-y-8">
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-white border-4 border-orange-500 z-10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text w-5 h-5 text-blue-900">
                        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                        <path d="M10 9H8" />
                        <path d="M16 13H8" />
                        <path d="M16 17H8" />
                      </svg>
                    </div>
                    <div className="w-5/12 mr-12">
                      <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-900">
                        <div className="flex items-center mb-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 text-blue-900">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text w-5 h-5 text-blue-900">
                              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                              <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                              <path d="M10 9H8" />
                              <path d="M16 13H8" />
                              <path d="M16 17H8" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">
                              {c.t46}
                            </p>
                            <h3 className="text-lg font-bold text-blue-900">
                              {c.t47}
                            </h3>
                          </div>
                        </div>
                        <p className="text-gray-700">
                          {c.t48}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-start relative opacity-0 translate-y-8">
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-white border-4 border-orange-500 z-10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar w-5 h-5 text-orange-600">
                        <path d="M8 2v4" />
                        <path d="M16 2v4" />
                        <rect width="18" height="18" x="3" y="4" rx="2" />
                        <path d="M3 10h18" />
                      </svg>
                    </div>
                    <div className="w-5/12 ml-12">
                      <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-orange-500">
                        <div className="flex items-center mb-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-orange-100 text-orange-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar w-5 h-5 text-orange-600">
                              <path d="M8 2v4" />
                              <path d="M16 2v4" />
                              <rect width="18" height="18" x="3" y="4" rx="2" />
                              <path d="M3 10h18" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">
                              {c.t49}
                            </p>
                            <h3 className="text-lg font-bold text-orange-600">
                              {c.t50}
                            </h3>
                          </div>
                        </div>
                        <p className="text-gray-700">
                          {c.t51}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end relative opacity-0 translate-y-8">
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-white border-4 border-orange-500 z-10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar w-5 h-5 text-blue-900">
                        <path d="M8 2v4" />
                        <path d="M16 2v4" />
                        <rect width="18" height="18" x="3" y="4" rx="2" />
                        <path d="M3 10h18" />
                      </svg>
                    </div>
                    <div className="w-5/12 mr-12">
                      <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-900">
                        <div className="flex items-center mb-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 text-blue-900">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar w-5 h-5 text-blue-900">
                              <path d="M8 2v4" />
                              <path d="M16 2v4" />
                              <rect width="18" height="18" x="3" y="4" rx="2" />
                              <path d="M3 10h18" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">
                              {c.t52}
                            </p>
                            <h3 className="text-lg font-bold text-blue-900">
                              {c.t53}
                            </h3>
                          </div>
                        </div>
                        <p className="text-gray-700">
                          {c.t54}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-start relative opacity-0 translate-y-8">
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-white border-4 border-orange-500 z-10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star w-5 h-5 text-orange-600">
                        <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
                      </svg>
                    </div>
                    <div className="w-5/12 ml-12">
                      <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-orange-500">
                        <div className="flex items-center mb-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-orange-100 text-orange-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star w-5 h-5 text-orange-600">
                              <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">
                              {c.t55}
                            </p>
                            <h3 className="text-lg font-bold text-orange-600">
                              {c.t56}
                            </h3>
                          </div>
                        </div>
                        <p className="text-gray-700">
                          {c.t57}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end relative opacity-0 translate-y-8">
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-white border-4 border-orange-500 z-10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock w-5 h-5 text-blue-900">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <div className="w-5/12 mr-12">
                      <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-900">
                        <div className="flex items-center mb-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 text-blue-900">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock w-5 h-5 text-blue-900">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-600">
                              {c.t58}
                            </p>
                            <h3 className="text-lg font-bold text-blue-900">
                              {c.t59}
                            </h3>
                          </div>
                        </div>
                        <p className="text-gray-700">
                          {c.t60}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-blue-900 mb-8 text-center uppercase">
                {c.t61}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 border rounded-lg p-6 transition-all opacity-0 translate-y-8">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-truck text-blue-900">
                      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                      <path d="M15 18H9" />
                      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
                      <circle cx="17" cy="18" r="2" />
                      <circle cx="7" cy="18" r="2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-blue-900 mb-2">
                    {c.t62}
                  </h3>
                  <div className="text-xl font-bold mb-2">
                    {c.t63}
                  </div>
                  <p className="text-gray-600 text-sm">
                    {c.t64}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 border rounded-lg p-6 transition-all opacity-0 translate-y-8">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layers text-orange-600">
                      <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" />
                      <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" />
                      <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-orange-600 mb-2">
                    {c.t65}
                  </h3>
                  <div className="text-xl font-bold mb-2">
                    {c.t66}
                  </div>
                  <p className="text-gray-600 text-sm">
                    {c.t67}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 border rounded-lg p-6 transition-all opacity-0 translate-y-8">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layers text-blue-900">
                      <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" />
                      <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" />
                      <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-blue-900 mb-2">
                    {c.t68}
                  </h3>
                  <div className="text-xl font-bold mb-2">
                    {c.t69}
                  </div>
                  <p className="text-gray-600 text-sm">
                    {c.t70}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 border rounded-lg p-6 transition-all opacity-0 translate-y-8">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield text-orange-600">
                      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-orange-600 mb-2">
                    {c.t71}
                  </h3>
                  <div className="text-xl font-bold mb-2">
                    {c.t72}
                  </div>
                  <p className="text-gray-600 text-sm">
                    {c.t73}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 border rounded-lg p-6 transition-all opacity-0 translate-y-8">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin text-orange-600">
                      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-orange-600 mb-2">
                    {c.t74}
                  </h3>
                  <div className="text-xl font-bold mb-2">
                    {c.t75}
                  </div>
                  <p className="text-gray-600 text-sm">
                    {c.t76}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 border rounded-lg p-6 transition-all opacity-0 translate-y-8">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar text-blue-900">
                      <path d="M8 2v4" />
                      <path d="M16 2v4" />
                      <rect width="18" height="18" x="3" y="4" rx="2" />
                      <path d="M3 10h18" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-blue-900 mb-2">
                    {c.t77}
                  </h3>
                  <div className="text-xl font-bold mb-2">
                    {c.t78}
                  </div>
                  <p className="text-gray-600 text-sm">
                    {c.t79}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 border rounded-lg p-6 transition-all opacity-0 translate-y-8">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up text-orange-600">
                      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                      <polyline points="16 7 22 7 22 13" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-orange-600 mb-2">
                    {c.t80}
                  </h3>
                  <div className="text-xl font-bold mb-2">
                    {c.t81}
                  </div>
                  <p className="text-gray-600 text-sm">
                    {c.t82}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 border rounded-lg p-6 transition-all opacity-0 translate-y-8">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users text-blue-900">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-blue-900 mb-2">
                    {c.t83}
                  </h3>
                  <div className="text-xl font-bold mb-2">
                    {c.t84}
                  </div>
                  <p className="text-gray-600 text-sm">
                    {c.t85}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="technology" className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <div>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4 uppercase">
                {c.t86}
              </h2>
              <p className="text-lg text-gray-700 max-w-3xl mx-auto">
                {c.t87}
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="opacity-0 translate-y-8">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="h-64 overflow-hidden relative">
                    <img src={c.img2} alt="Semi-rigid pavement technology" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent" />
                    <div className="absolute bottom-0 left-0 w-full p-6 text-white">
                      <h3 className="text-xl font-bold">
                        {c.t88}
                      </h3>
                      <p className="text-sm opacity-90">
                        {c.t89}
                      </p>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-blue-900 mb-4">
                      {c.t90}
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check-big text-orange-600">
                            <path d="M21.801 10A10 10 0 1 1 17 3.335" />
                            <path d="m9 11 3 3L22 4" />
                          </svg>
                        </div>
                        <span className="text-gray-700">
                          {c.t91}
                        </span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check-big text-orange-600">
                            <path d="M21.801 10A10 10 0 1 1 17 3.335" />
                            <path d="m9 11 3 3L22 4" />
                          </svg>
                        </div>
                        <span className="text-gray-700">
                          {c.t92}
                        </span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check-big text-orange-600">
                            <path d="M21.801 10A10 10 0 1 1 17 3.335" />
                            <path d="m9 11 3 3L22 4" />
                          </svg>
                        </div>
                        <span className="text-gray-700">
                          {c.t93}
                        </span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check-big text-orange-600">
                            <path d="M21.801 10A10 10 0 1 1 17 3.335" />
                            <path d="m9 11 3 3L22 4" />
                          </svg>
                        </div>
                        <span className="text-gray-700">
                          {c.t94}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="opacity-0 translate-y-8">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="h-64 overflow-hidden relative">
                    <img src={c.img3} alt="Road construction technology" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-orange-600/80 to-transparent" />
                    <div className="absolute bottom-0 left-0 w-full p-6 text-white">
                      <h3 className="text-xl font-bold">
                        {c.t95}
                      </h3>
                      <p className="text-sm opacity-90">
                        {c.t96}
                      </p>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-orange-600 mb-4">
                      {c.t97}
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check-big text-blue-900">
                            <path d="M21.801 10A10 10 0 1 1 17 3.335" />
                            <path d="m9 11 3 3L22 4" />
                          </svg>
                        </div>
                        <span className="text-gray-700">
                          {c.t98}
                        </span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check-big text-blue-900">
                            <path d="M21.801 10A10 10 0 1 1 17 3.335" />
                            <path d="m9 11 3 3L22 4" />
                          </svg>
                        </div>
                        <span className="text-gray-700">
                          {c.t99}
                        </span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check-big text-blue-900">
                            <path d="M21.801 10A10 10 0 1 1 17 3.335" />
                            <path d="m9 11 3 3L22 4" />
                          </svg>
                        </div>
                        <span className="text-gray-700">
                          {c.t100}
                        </span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check-big text-blue-900">
                            <path d="M21.801 10A10 10 0 1 1 17 3.335" />
                            <path d="m9 11 3 3L22 4" />
                          </svg>
                        </div>
                        <span className="text-gray-700">
                          {c.t101}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-16 bg-gradient-to-r from-blue-900 to-blue-800 rounded-xl shadow-lg overflow-hidden">
              <div className="p-8 text-white">
                <h3 className="text-2xl font-bold mb-4 text-center uppercase">
                  {c.t102}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full mx-auto flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock text-white">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold mb-2">
                      {c.t103}
                    </h4>
                    <p className="text-sm text-blue-200">
                      {c.t104}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full mx-auto flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up text-white">
                        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                        <polyline points="16 7 22 7 22 13" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold mb-2">
                      {c.t105}
                    </h4>
                    <p className="text-sm text-blue-200">
                      {c.t106}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full mx-auto flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield text-white">
                        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold mb-2">
                      {c.t107}
                    </h4>
                    <p className="text-sm text-blue-200">
                      {c.t108}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 md:py-24 bg-gradient-to-r from-blue-900 to-blue-800 text-white">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="max-w-4xl mx-auto">
            <div>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 uppercase">
                  {c.t109}
                </h2>
                <p className="text-xl opacity-90">
                  {c.t110}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="bg-white/10 backdrop-blur-sm p-8 rounded-xl opacity-0 translate-y-8">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-award text-white">
                      <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" />
                      <circle cx="12" cy="8" r="6" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">
                    {c.t111}
                  </h3>
                  <p className="opacity-90 mb-4">
                    {c.t112}
                  </p>
                  <p className="opacity-90">
                    {c.t113}
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-8 rounded-xl opacity-0 translate-y-8">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text text-white">
                      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                      <path d="M10 9H8" />
                      <path d="M16 13H8" />
                      <path d="M16 17H8" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">
                    {c.t114}
                  </h3>
                  <p className="opacity-90 mb-4">
                    {c.t115}
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                      <span>
                        {c.t116}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                      <span>
                        {c.t117}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                      <span>
                        {c.t118}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-blue-900 mb-6">
              {c.t119}
            </h2>
            <p className="text-gray-600 mb-8">
              {c.t120}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="/routes-facilities" className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded-md font-medium transition-all flex items-center">
                {c.t121}
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right ml-2">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </a>
              <a href="/economic-impact" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-md font-medium transition-all flex items-center">
                {c.t122}
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right ml-2">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
