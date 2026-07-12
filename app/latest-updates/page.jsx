import { getContent } from '../../lib/content';

export const dynamic = 'force-dynamic';

/**
 * latest-updates — reconstructed from the original site's live DOM.
 * All copy and imagery comes from content key "page.latest-updates" so the admin
 * panel can edit every field.
 */
export default async function LatestUpdatesPage() {
  const c = await getContent('page.latest-updates');
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
          </div>
        </div>
      </section>
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-blue-900 mb-8 text-center uppercase">
            {c.t3}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <a href="https://www.newagebd.net/article/229849/dhaka-bypass-expressway-facilitates-unhindered-eid-travels" target="_blank" rel="noopener noreferrer" className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
              <div className="p-6 flex-grow">
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {c.t4}
                  </span>
                  <span className="text-sm text-gray-500">
                    {c.t5}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                  {c.t6}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {c.t7}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-newspaper text-orange-500 mr-2">
                      <path d="M15 18h-5" />
                      <path d="M18 14h-8" />
                      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9a2 2 0 0 1 2-2h2" />
                      <rect width="8" height="4" x="10" y="6" rx="1" />
                    </svg>
                    <span className="text-sm text-gray-500">
                      {c.t8}
                    </span>
                  </div>
                  <div className="flex items-center text-orange-500 hover:text-orange-600">
                    <span className="text-sm font-medium mr-1">
                      {c.t9}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-external-link">
                      <path d="M15 3h6v6" />
                      <path d="M10 14 21 3" />
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    </svg>
                  </div>
                </div>
              </div>
            </a>
            <a href="https://www.tbsnews.net/bangladesh/infrastructure/dhaka-bypass-expressway-open-partly-1-may-1110666" target="_blank" rel="noopener noreferrer" className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
              <div className="p-6 flex-grow">
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {c.t10}
                  </span>
                  <span className="text-sm text-gray-500">
                    {c.t11}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                  {c.t12}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {c.t13}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-newspaper text-orange-500 mr-2">
                      <path d="M15 18h-5" />
                      <path d="M18 14h-8" />
                      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9a2 2 0 0 1 2-2h2" />
                      <rect width="8" height="4" x="10" y="6" rx="1" />
                    </svg>
                    <span className="text-sm text-gray-500">
                      {c.t14}
                    </span>
                  </div>
                  <div className="flex items-center text-orange-500 hover:text-orange-600">
                    <span className="text-sm font-medium mr-1">
                      {c.t15}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-external-link">
                      <path d="M15 3h6v6" />
                      <path d="M10 14 21 3" />
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    </svg>
                  </div>
                </div>
              </div>
            </a>
            <a href="https://www.tbsnews.net/bangladesh/transport/18km-dhaka-bypass-expressway-opened-traffic-ahead-eid-1104321" target="_blank" rel="noopener noreferrer" className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
              <div className="p-6 flex-grow">
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {c.t16}
                  </span>
                  <span className="text-sm text-gray-500">
                    {c.t17}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                  {c.t18}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {c.t19}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-newspaper text-orange-500 mr-2">
                      <path d="M15 18h-5" />
                      <path d="M18 14h-8" />
                      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9a2 2 0 0 1 2-2h2" />
                      <rect width="8" height="4" x="10" y="6" rx="1" />
                    </svg>
                    <span className="text-sm text-gray-500">
                      {c.t20}
                    </span>
                  </div>
                  <div className="flex items-center text-orange-500 hover:text-orange-600">
                    <span className="text-sm font-medium mr-1">
                      {c.t21}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-external-link">
                      <path d="M15 3h6v6" />
                      <path d="M10 14 21 3" />
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    </svg>
                  </div>
                </div>
              </div>
            </a>
            <a href="https://www.dhakatribune.com/bangladesh/development/350516/dhaka-bypass-expressway-to-be-operational-by-july" target="_blank" rel="noopener noreferrer" className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
              <div className="p-6 flex-grow">
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {c.t22}
                  </span>
                  <span className="text-sm text-gray-500">
                    {c.t23}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                  {c.t24}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {c.t25}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-newspaper text-orange-500 mr-2">
                      <path d="M15 18h-5" />
                      <path d="M18 14h-8" />
                      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9a2 2 0 0 1 2-2h2" />
                      <rect width="8" height="4" x="10" y="6" rx="1" />
                    </svg>
                    <span className="text-sm text-gray-500">
                      {c.t26}
                    </span>
                  </div>
                  <div className="flex items-center text-orange-500 hover:text-orange-600">
                    <span className="text-sm font-medium mr-1">
                      {c.t27}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-external-link">
                      <path d="M15 3h6v6" />
                      <path d="M10 14 21 3" />
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    </svg>
                  </div>
                </div>
              </div>
            </a>
            <a href="https://www.adb.org/news/government-bangladesh-signs-ppp-contract-dhaka-bypass" target="_blank" rel="noopener noreferrer" className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
              <div className="p-6 flex-grow">
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {c.t28}
                  </span>
                  <span className="text-sm text-gray-500">
                    {c.t29}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                  {c.t30}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {c.t31}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-newspaper text-orange-500 mr-2">
                      <path d="M15 18h-5" />
                      <path d="M18 14h-8" />
                      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9a2 2 0 0 1 2-2h2" />
                      <rect width="8" height="4" x="10" y="6" rx="1" />
                    </svg>
                    <span className="text-sm text-gray-500">
                      {c.t32}
                    </span>
                  </div>
                  <div className="flex items-center text-orange-500 hover:text-orange-600">
                    <span className="text-sm font-medium mr-1">
                      {c.t33}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-external-link">
                      <path d="M15 3h6v6" />
                      <path d="M10 14 21 3" />
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    </svg>
                  </div>
                </div>
              </div>
            </a>
            <a href="https://www.pppo.gov.bd/projects-dhaka-bypass.php" target="_blank" rel="noopener noreferrer" className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
              <div className="p-6 flex-grow">
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {c.t34}
                  </span>
                  <span className="text-sm text-gray-500">
                    {c.t35}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                  {c.t36}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {c.t37}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-newspaper text-orange-500 mr-2">
                      <path d="M15 18h-5" />
                      <path d="M18 14h-8" />
                      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9a2 2 0 0 1 2-2h2" />
                      <rect width="8" height="4" x="10" y="6" rx="1" />
                    </svg>
                    <span className="text-sm text-gray-500">
                      {c.t38}
                    </span>
                  </div>
                  <div className="flex items-center text-orange-500 hover:text-orange-600">
                    <span className="text-sm font-medium mr-1">
                      {c.t39}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-external-link">
                      <path d="M15 3h6v6" />
                      <path d="M10 14 21 3" />
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    </svg>
                  </div>
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>
      <section className="py-12">
        <div className="container mx-auto px-4">
          <button type="button" aria-hidden="true" style={{ position: "fixed", top: "1px", left: "1px", width: "1px", height: "0", padding: "0", margin: "-1px", overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", borderWidth: "0" }} />
          <div>
            <h2 className="text-3xl font-bold text-blue-900 mb-8 text-center uppercase">
              {c.t40}
            </h2>
            <div id="headlessui-tabs-panel-«Racutb»" role="tabpanel" tabIndex="0" data-headlessui-state="selected" data-selected="">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <img src={c.img2} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
                <img src={c.img3} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
                <img src={c.img4} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
                <img src={c.img5} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
                <img src={c.img6} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
                <img src={c.img7} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
                <img src={c.img8} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
                <img src={c.img9} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
                <img src={c.img10} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
                <img src={c.img11} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
                <img src={c.img12} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
                <img src={c.img13} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
                <img src={c.img14} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
                <img src={c.img15} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
                <img src={c.img16} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
                <img src={c.img17} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
                <img src={c.img18} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
                <img src={c.img19} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
                <img src={c.img20} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
                <img src={c.img21} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
                <img src={c.img22} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
                <img src={c.img23} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
                <img src={c.img24} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
                <img src={c.img25} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
                <img src={c.img26} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
                <img src={c.img27} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
                <img src={c.img28} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
                <img src={c.img29} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
                <img src={c.img30} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
                <img src={c.img31} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
                <img src={c.img32} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
                <img src={c.img33} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
                <img src={c.img34} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
                <img src={c.img35} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
                <img src={c.img36} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
                <img src={c.img37} alt="" className="w-full h-full object-cover transition-transform hover:scale-110 cursor-pointer rounded-lg" type="button" />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 bg-blue-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            {c.t41}
          </h2>
          <p className="text-lg text-white/80 max-w-3xl mx-auto mb-8">
            {c.t42}
          </p>
          <div className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input type="email" placeholder="Your email address" className="px-4 py-3 rounded-md flex-grow focus:outline-none focus:ring-2 focus:ring-orange-500" />
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-md transition-all font-semibold">
                {c.t43}
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
