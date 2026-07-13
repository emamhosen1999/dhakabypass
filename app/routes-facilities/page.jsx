import { getContent } from '../../lib/content';
import SectionTabs from '../../components/SectionTabs';

export const dynamic = 'force-dynamic';

/**
 * routes-facilities — reconstructed from the original site's live DOM.
 * All copy and imagery comes from content key "page.routes-facilities" so the admin
 * panel can edit every field.
 */
export default async function RoutesFacilitiesPage() {
  const c = await getContent('page.routes-facilities');
  return (
    <>
      <div className="pt-20 bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 uppercase">
            {c.t1}
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl">
            {c.t2}
          </p>
        </div>
      </div>
      <div className="bg-white shadow-md sticky top-16 z-10">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <SectionTabs
            variant="underline"
            tabs={[
              { label: c.t3, targetId: 'route' },
              { label: c.t4, targetId: 'locations' },
              { label: c.t5, targetId: 'toll' },
              { label: c.t6, targetId: 'facilities' },
            ]}
          />
        </div>
      </div>
      <div className="py-8 md:py-12 bg-white">
        <div id="route" className="mb-16">
          <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-blue-900 uppercase">
              {c.t7}
            </h2>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-10">
              <div className="h-96 bg-blue-50 relative">
                <svg className="w-full h-full" viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f0f9ff" />
                      <stop offset="100%" stopColor="#e6f0f9" />
                    </linearGradient>
                    <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#004b8d" />
                      <stop offset="100%" stopColor="#0063b1" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#00000022" />
                    </filter>
                  </defs>
                  <rect x="0" y="0" width="1000" height="400" fill="url(#bgGradient)" />
                  <path d="M100,300 Q300,350 500,300 T900,350" stroke="#e2e8f0" strokeWidth="20" fill="none" />
                  <path d="M200,100 Q400,50 600,100 T900,50" stroke="#e2e8f0" strokeWidth="15" fill="none" />
                  <path d="M300,250 C320,240 340,260 360,250 C380,240 400,260 420,250" stroke="#b3e0ff" strokeWidth="8" fill="none" strokeLinecap="round" />
                  <path d="M700,300 C720,290 740,310 760,300 C780,290 800,310 820,300" stroke="#b3e0ff" strokeWidth="10" fill="none" strokeLinecap="round" />
                  <path d="M150,165 C250,185 350,215 450,235 C550,255 650,285 750,345 C850,405 900,365 950,345" stroke="#004b8d30" strokeWidth="28" fill="none" strokeLinecap="round" />
                  <path d="M150,150 C250,170 350,200 450,220 C550,240 650,270 750,330 C850,390 900,350 950,330" stroke="url(#routeGradient)" strokeWidth="12" fill="none" strokeLinecap="round" filter="url(#shadow)" />
                  <path d="M150,150 C250,170 350,200 450,220 C550,240 650,270 750,330 C850,390 900,350 950,330" stroke="#f1582a" strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="10,10" className="animate-dash" />
                  <path d="M350,200 C400,210 500,230 650,270" stroke="#f1582a" strokeWidth="8" fill="none" strokeLinecap="round" filter="url(#glow)" />
                  <rect x="430" y="230" width="240" height="24" rx="12" fill="white" fillOpacity="0.9" />
                  <text x="550" y="247" textAnchor="middle" fill="#f1582a" fontWeight="bold" fontSize="14">
                    {c.t8}
                  </text>
                  <g>
                    <circle cx="150" cy="150" r="14" fill="#004b8d" opacity="0.2" className="animate-ping" />
                    <circle cx="150" cy="150" r="10" fill="#004b8d" />
                    <circle cx="150" cy="150" r="4" fill="white" />
                    <rect x="110" y="100" width="80" height="38" rx="4" fill="white" fillOpacity="0.9" filter="url(#shadow)" />
                    <text x="150" y="117" textAnchor="middle" fill="#004b8d" fontWeight="bold" fontSize="14">
                      {c.t9}
                    </text>
                    <text x="150" y="132" textAnchor="middle" fill="#666" fontSize="11">
                      {c.t10}
                    </text>
                    <circle cx="350" cy="200" r="10" fill="#f1582a" />
                    <circle cx="350" cy="200" r="4" fill="white" />
                    <rect x="310" y="160" width="80" height="38" rx="4" fill="white" fillOpacity="0.9" filter="url(#shadow)" />
                    <text x="350" y="177" textAnchor="middle" fill="#f1582a" fontWeight="bold" fontSize="14">
                      {c.t11}
                    </text>
                    <text x="350" y="192" textAnchor="middle" fill="#666" fontSize="11">
                      {c.t12}
                    </text>
                    <circle cx="450" cy="220" r="8" fill="#004b8d" />
                    <circle cx="450" cy="220" r="3" fill="white" />
                    <rect x="410" y="180" width="80" height="24" rx="4" fill="white" fillOpacity="0.9" filter="url(#shadow)" />
                    <text x="450" y="197" textAnchor="middle" fill="#004b8d" fontWeight="bold" fontSize="12">
                      {c.t13}
                    </text>
                    <circle cx="650" cy="270" r="10" fill="#f1582a" />
                    <circle cx="650" cy="270" r="4" fill="white" />
                    <rect x="610" y="230" width="80" height="38" rx="4" fill="white" fillOpacity="0.9" filter="url(#shadow)" />
                    <text x="650" y="247" textAnchor="middle" fill="#f1582a" fontWeight="bold" fontSize="14">
                      {c.t14}
                    </text>
                    <text x="650" y="262" textAnchor="middle" fill="#666" fontSize="11">
                      {c.t15}
                    </text>
                    <circle cx="750" cy="330" r="8" fill="#004b8d" />
                    <circle cx="750" cy="330" r="3" fill="white" />
                    <rect x="710" y="290" width="80" height="24" rx="4" fill="white" fillOpacity="0.9" filter="url(#shadow)" />
                    <text x="750" y="307" textAnchor="middle" fill="#004b8d" fontWeight="bold" fontSize="12">
                      {c.t16}
                    </text>
                    <circle cx="950" cy="330" r="14" fill="#f1582a" opacity="0.2" className="animate-ping" />
                    <circle cx="950" cy="330" r="10" fill="#f1582a" />
                    <circle cx="950" cy="330" r="4" fill="white" />
                    <rect x="910" y="280" width="80" height="38" rx="4" fill="white" fillOpacity="0.9" filter="url(#shadow)" />
                    <text x="950" y="297" textAnchor="middle" fill="#f1582a" fontWeight="bold" fontSize="14">
                      {c.t17}
                    </text>
                    <text x="950" y="312" textAnchor="middle" fill="#666" fontSize="11">
                      {c.t18}
                    </text>
                  </g>
                  <g>
                    <line x1="320" y1="180" x2="350" y2="200" stroke="#004b8d" strokeWidth="2" strokeDasharray="5,3" />
                    <rect x="280" y="150" width="40" height="20" rx="10" fill="#004b8d" />
                    <text x="300" y="164" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                      {c.t19}
                    </text>
                    <line x1="150" y1="90" x2="150" y2="150" stroke="#004b8d" strokeWidth="2" strokeDasharray="5,3" />
                    <rect x="130" y="70" width="40" height="20" rx="10" fill="#004b8d" />
                    <text x="150" y="84" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                      {c.t20}
                    </text>
                    <line x1="750" y1="280" x2="750" y2="330" stroke="#004b8d" strokeWidth="2" strokeDasharray="5,3" />
                    <rect x="730" y="260" width="40" height="20" rx="10" fill="#004b8d" />
                    <text x="750" y="274" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                      {c.t21}
                    </text>
                    <line x1="970" y1="360" x2="950" y2="330" stroke="#004b8d" strokeWidth="2" strokeDasharray="5,3" />
                    <rect x="960" y="360" width="40" height="20" rx="10" fill="#004b8d" />
                    <text x="980" y="374" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                      {c.t22}
                    </text>
                  </g>
                  <g transform="translate(900, 100)">
                    <circle cx="0" cy="0" r="30" fill="white" fillOpacity="0.8" />
                    <path d="M0,-25 L0,25 M-25,0 L25,0" stroke="#004b8d" strokeWidth="1" />
                    <text x="0" y="-15" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#004b8d">
                      {c.t23}
                    </text>
                    <text x="0" y="20" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#004b8d">
                      {c.t24}
                    </text>
                    <text x="-15" y="5" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#004b8d">
                      {c.t25}
                    </text>
                    <text x="15" y="5" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#004b8d">
                      {c.t26}
                    </text>
                    <circle cx="0" cy="0" r="5" fill="#004b8d" />
                  </g>
                </svg>
                <div className="absolute top-2 left-2">
                  <div className="bg-white bg-opacity-80 p-3 rounded-lg shadow-md">
                    <h4 className="text-sm font-bold text-blue-900 mb-2">
                      {c.t27}
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded-full bg-blue-900 mr-2" />
                        <span>
                          {c.t28}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 rounded-full bg-orange-500 mr-2" />
                        <span>
                          {c.t29}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="h-1 w-6 bg-orange-500 mr-2" />
                        <span>
                          {c.t30}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="h-1 w-6 bg-blue-900 mr-2" />
                        <span>
                          {c.t31}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-white">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-blue-900">
                    {c.t32}
                  </h3>
                </div>
                <p className="text-gray-800 mb-4">
                  {c.t33}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">
                      {c.t34}
                    </div>
                    <div className="text-blue-900 font-bold text-xl">
                      {c.t35}
                    </div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">
                      {c.t36}
                    </div>
                    <div className="text-blue-900 font-bold text-xl">
                      {c.t37}
                    </div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">
                      {c.t38}
                    </div>
                    <div className="text-blue-900 font-bold text-xl">
                      {c.t39}
                    </div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">
                      {c.t40}
                    </div>
                    <div className="text-orange-500 font-bold text-xl">
                      {c.t41}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold text-blue-900 mb-4">
                  {c.t42}
                </h3>
                <p className="text-gray-800 mb-4">
                  {c.t43}
                </p>
                <p className="text-gray-800">
                  {c.t44}
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-blue-900/10 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                      <div className="w-2 h-2 rounded-full bg-blue-900" />
                    </div>
                    <span className="text-gray-800">
                      {c.t45}
                    </span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-blue-900/10 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                      <div className="w-2 h-2 rounded-full bg-blue-900" />
                    </div>
                    <span className="text-gray-800">
                      {c.t46}
                    </span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-blue-900/10 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                      <div className="w-2 h-2 rounded-full bg-blue-900" />
                    </div>
                    <span className="text-gray-800">
                      {c.t47}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-orange-500 p-6 rounded-xl shadow-md text-white">
                <h3 className="text-xl font-bold mb-4">
                  {c.t48}
                </h3>
                <p className="text-white mb-4">
                  {c.t49}
                </p>
                <p className="text-white mb-4">
                  {c.t50}
                </p>
                <div className="mt-6 bg-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">
                      {c.t51}
                    </div>
                    <div className="font-bold">
                      {c.t52}
                    </div>
                  </div>
                  <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full" style={{ width: "68%" }} />
                  </div>
                  <div className="mt-2 text-xs text-white text-right">
                    {c.t53}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div id="locations" className="mb-16">
          <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-blue-900 uppercase">
              {c.t54}
            </h2>
            <p className="text-lg text-gray-800 mb-8">
              {c.t55}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-blue-50 p-6">
                  <h3 className="text-xl font-bold text-blue-900 mb-2">
                    {c.t56}
                  </h3>
                  <p className="text-gray-800">
                    {c.t57}
                  </p>
                </div>
                <div className="bg-white p-6">
                  <h4 className="font-semibold mb-3 text-gray-800">
                    {c.t58}
                  </h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="text-blue-900 mr-2">
                        {c.t59}
                      </span>
                      <span className="text-gray-800">
                        {c.t60}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-900 mr-2">
                        {c.t61}
                      </span>
                      <span className="text-gray-800">
                        {c.t62}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-900 mr-2">
                        {c.t63}
                      </span>
                      <span className="text-gray-800">
                        {c.t64}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-blue-50 p-6">
                  <h3 className="text-xl font-bold text-blue-900 mb-2">
                    {c.t65}
                  </h3>
                  <p className="text-gray-800">
                    {c.t66}
                  </p>
                </div>
                <div className="bg-white p-6">
                  <h4 className="font-semibold mb-3 text-gray-800">
                    {c.t67}
                  </h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="text-blue-900 mr-2">
                        {c.t68}
                      </span>
                      <span className="text-gray-800">
                        {c.t69}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-900 mr-2">
                        {c.t70}
                      </span>
                      <span className="text-gray-800">
                        {c.t71}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-900 mr-2">
                        {c.t72}
                      </span>
                      <span className="text-gray-800">
                        {c.t73}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-blue-50 p-6">
                  <h3 className="text-xl font-bold text-blue-900 mb-2">
                    {c.t74}
                  </h3>
                  <p className="text-gray-800">
                    {c.t75}
                  </p>
                </div>
                <div className="bg-white p-6">
                  <h4 className="font-semibold mb-3 text-gray-800">
                    {c.t76}
                  </h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="text-blue-900 mr-2">
                        {c.t77}
                      </span>
                      <span className="text-gray-800">
                        {c.t78}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-900 mr-2">
                        {c.t79}
                      </span>
                      <span className="text-gray-800">
                        {c.t80}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-900 mr-2">
                        {c.t81}
                      </span>
                      <span className="text-gray-800">
                        {c.t82}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-blue-50 p-6">
                  <h3 className="text-xl font-bold text-blue-900 mb-2">
                    {c.t83}
                  </h3>
                  <p className="text-gray-800">
                    {c.t84}
                  </p>
                </div>
                <div className="bg-white p-6">
                  <h4 className="font-semibold mb-3 text-gray-800">
                    {c.t85}
                  </h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="text-blue-900 mr-2">
                        {c.t86}
                      </span>
                      <span className="text-gray-800">
                        {c.t87}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-900 mr-2">
                        {c.t88}
                      </span>
                      <span className="text-gray-800">
                        {c.t89}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-900 mr-2">
                        {c.t90}
                      </span>
                      <span className="text-gray-800">
                        {c.t91}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-blue-50 p-6">
                  <h3 className="text-xl font-bold text-blue-900 mb-2">
                    {c.t92}
                  </h3>
                  <p className="text-gray-800">
                    {c.t93}
                  </p>
                </div>
                <div className="bg-white p-6">
                  <h4 className="font-semibold mb-3 text-gray-800">
                    {c.t94}
                  </h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="text-blue-900 mr-2">
                        {c.t95}
                      </span>
                      <span className="text-gray-800">
                        {c.t96}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-900 mr-2">
                        {c.t97}
                      </span>
                      <span className="text-gray-800">
                        {c.t98}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-900 mr-2">
                        {c.t99}
                      </span>
                      <span className="text-gray-800">
                        {c.t100}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div id="toll" className="mb-16">
          <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-blue-900 uppercase">
              {c.t101}
            </h2>
            <p className="text-lg text-gray-800 mb-8">
              {c.t102}
            </p>
            <div className="mb-10">
              <h3 className="text-xl font-bold mb-4 text-blue-900">
                {c.t103}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-8">
                <button className="flex flex-col items-center p-3 rounded-lg border transition bg-white text-gray-800 border-gray-200 hover:border-blue-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-car text-blue-900">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                    <circle cx="7" cy="17" r="2" />
                    <path d="M9 17h6" />
                    <circle cx="17" cy="17" r="2" />
                  </svg>
                  <span className="mt-2 text-xs font-medium whitespace-nowrap">
                    {c.t104}
                  </span>
                </button>
                <button className="flex flex-col items-center p-3 rounded-lg border transition bg-white text-gray-800 border-gray-200 hover:border-blue-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bus text-blue-900">
                    <path d="M8 6v6" />
                    <path d="M15 6v6" />
                    <path d="M2 12h19.6" />
                    <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3" />
                    <circle cx="7" cy="18" r="2" />
                    <path d="M9 18h5" />
                    <circle cx="16" cy="18" r="2" />
                  </svg>
                  <span className="mt-2 text-xs font-medium whitespace-nowrap">
                    {c.t105}
                  </span>
                </button>
                <button className="flex flex-col items-center p-3 rounded-lg border transition bg-white text-gray-800 border-gray-200 hover:border-blue-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bus text-blue-900">
                    <path d="M8 6v6" />
                    <path d="M15 6v6" />
                    <path d="M2 12h19.6" />
                    <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3" />
                    <circle cx="7" cy="18" r="2" />
                    <path d="M9 18h5" />
                    <circle cx="16" cy="18" r="2" />
                  </svg>
                  <span className="mt-2 text-xs font-medium whitespace-nowrap">
                    {c.t106}
                  </span>
                </button>
                <button className="flex flex-col items-center p-3 rounded-lg border transition bg-white text-gray-800 border-gray-200 hover:border-blue-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-truck text-blue-900">
                    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                    <path d="M15 18H9" />
                    <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
                    <circle cx="17" cy="18" r="2" />
                    <circle cx="7" cy="18" r="2" />
                  </svg>
                  <span className="mt-2 text-xs font-medium whitespace-nowrap">
                    {c.t107}
                  </span>
                </button>
                <button className="flex flex-col items-center p-3 rounded-lg border transition bg-white text-gray-800 border-gray-200 hover:border-blue-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-truck text-blue-900">
                    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                    <path d="M15 18H9" />
                    <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
                    <circle cx="17" cy="18" r="2" />
                    <circle cx="7" cy="18" r="2" />
                  </svg>
                  <span className="mt-2 text-xs font-medium whitespace-nowrap">
                    {c.t108}
                  </span>
                </button>
                <button className="flex flex-col items-center p-3 rounded-lg border transition bg-white text-gray-800 border-gray-200 hover:border-blue-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-truck text-blue-900">
                    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                    <path d="M15 18H9" />
                    <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
                    <circle cx="17" cy="18" r="2" />
                    <circle cx="7" cy="18" r="2" />
                  </svg>
                  <span className="mt-2 text-xs font-medium whitespace-nowrap">
                    {c.t109}
                  </span>
                </button>
                <button className="flex flex-col items-center p-3 rounded-lg border transition bg-white text-gray-800 border-gray-200 hover:border-blue-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-truck text-blue-900">
                    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                    <path d="M15 18H9" />
                    <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
                    <circle cx="17" cy="18" r="2" />
                    <circle cx="7" cy="18" r="2" />
                  </svg>
                  <span className="mt-2 text-xs font-medium whitespace-nowrap">
                    {c.t110}
                  </span>
                </button>
                <button className="flex flex-col items-center p-3 rounded-lg border transition bg-white text-gray-800 border-gray-200 hover:border-blue-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-truck text-blue-900">
                    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                    <path d="M15 18H9" />
                    <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
                    <circle cx="17" cy="18" r="2" />
                    <circle cx="7" cy="18" r="2" />
                  </svg>
                  <span className="mt-2 text-xs font-medium whitespace-nowrap">
                    {c.t111}
                  </span>
                </button>
                <button className="flex flex-col items-center p-3 rounded-lg border transition bg-white text-gray-800 border-gray-200 hover:border-blue-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bike text-blue-900">
                    <circle cx="18.5" cy="17.5" r="3.5" />
                    <circle cx="5.5" cy="17.5" r="3.5" />
                    <circle cx="15" cy="5" r="1" />
                    <path d="M12 17.5V14l-3-3 4-3 2 3h2" />
                  </svg>
                  <span className="mt-2 text-xs font-medium whitespace-nowrap">
                    {c.t112}
                  </span>
                </button>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-blue-900 text-white p-4">
                <h3 className="text-xl font-bold">
                  {c.t113}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        {c.t114}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        {c.t115}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        {c.t116}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        {c.t117}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr className="border-t border-gray-200 bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {c.t118}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {c.t119}
                        {c.t120}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {c.t121}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {c.t122}
                        {c.t123}
                      </td>
                    </tr>
                    <tr className="border-t border-gray-200 bg-white">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {c.t124}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {c.t125}
                        {c.t126}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {c.t127}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {c.t128}
                        {c.t129}
                      </td>
                    </tr>
                    <tr className="border-t border-gray-200 bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {c.t130}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {c.t131}
                        {c.t132}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {c.t133}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {c.t134}
                        {c.t135}
                      </td>
                    </tr>
                    <tr className="border-t border-gray-200 bg-white">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {c.t136}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {c.t137}
                        {c.t138}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {c.t139}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {c.t140}
                        {c.t141}
                      </td>
                    </tr>
                    <tr className="border-t border-gray-200 bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {c.t142}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {c.t143}
                        {c.t144}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {c.t145}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {c.t146}
                        {c.t147}
                      </td>
                    </tr>
                    <tr className="border-t border-gray-200 bg-white">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {c.t148}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {c.t149}
                        {c.t150}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {c.t151}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {c.t152}
                        {c.t153}
                      </td>
                    </tr>
                    <tr className="border-t border-gray-200 bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {c.t154}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {c.t155}
                        {c.t156}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {c.t157}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {c.t158}
                        {c.t159}
                      </td>
                    </tr>
                    <tr className="border-t border-gray-200 bg-white">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {c.t160}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {c.t161}
                        {c.t162}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {c.t163}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {c.t164}
                        {c.t165}
                      </td>
                    </tr>
                    <tr className="border-t border-gray-200 bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {c.t166}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {c.t167}
                        {c.t168}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {c.t169}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {c.t170}
                        {c.t171}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div id="facilities" className="mb-16">
          <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-blue-900 uppercase">
              {c.t172}
            </h2>
            <p className="text-lg text-gray-800 mb-8">
              {c.t173}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-coffee text-blue-900">
                      <path d="M10 2v2" />
                      <path d="M14 2v2" />
                      <path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1" />
                      <path d="M6 2v2" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-blue-900 mb-2">
                    {c.t174}
                  </h3>
                  <p className="text-gray-800 mb-4">
                    {c.t175}
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                      </div>
                      <span className="text-gray-800">
                        {c.t176}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                      </div>
                      <span className="text-gray-800">
                        {c.t177}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                      </div>
                      <span className="text-gray-800">
                        {c.t178}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-dollar-sign text-blue-900">
                      <line x1="12" x2="12" y1="2" y2="22" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-blue-900 mb-2">
                    {c.t179}
                  </h3>
                  <p className="text-gray-800 mb-4">
                    {c.t180}
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                      </div>
                      <span className="text-gray-800">
                        {c.t181}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                      </div>
                      <span className="text-gray-800">
                        {c.t182}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                      </div>
                      <span className="text-gray-800">
                        {c.t183}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-phone text-blue-900">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-blue-900 mb-2">
                    {c.t184}
                  </h3>
                  <p className="text-gray-800 mb-4">
                    {c.t185}
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                      </div>
                      <span className="text-gray-800">
                        {c.t186}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                      </div>
                      <span className="text-gray-800">
                        {c.t187}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                      </div>
                      <span className="text-gray-800">
                        {c.t188}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
