import { getContent } from '../../../lib/content';

export const dynamic = 'force-dynamic';

/**
 * project/overview — reconstructed from the original site's live DOM.
 * All copy and imagery comes from content key "page.project/overview" so the admin
 * panel can edit every field.
 */
export default async function ProjectOverviewPage() {
  const c = await getContent('page.project/overview');
  return (
    <>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-blue-900 mb-6">
          {c.t1}
        </h1>
        <p className="text-gray-700 mb-8">
          {c.t2}
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-800 mb-4">
                {c.t3}
              </h2>
              <p className="text-gray-700 mb-4">
                {c.t4}
              </p>
              <p className="text-gray-700 mb-4">
                {c.t5}
              </p>
              <p className="text-gray-700">
                {c.t6}
              </p>
            </div>
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-800 mb-4">
                {c.t7}
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>
                  {c.t8}
                </li>
                <li>
                  {c.t9}
                </li>
                <li>
                  {c.t10}
                </li>
                <li>
                  {c.t11}
                </li>
                <li>
                  {c.t12}
                </li>
                <li>
                  {c.t13}
                </li>
                <li>
                  {c.t14}
                </li>
                <li>
                  {c.t15}
                </li>
              </ul>
            </div>
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-800 mb-4">
                {c.t16}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900">
                    {c.t17}
                  </h3>
                  <p className="text-gray-700">
                    {c.t18}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {c.t19}
                  </h3>
                  <p className="text-gray-700">
                    {c.t20}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {c.t21}
                  </h3>
                  <p className="text-gray-700">
                    {c.t22}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {c.t23}
                  </h3>
                  <p className="text-gray-700">
                    {c.t24}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {c.t25}
                  </h3>
                  <p className="text-gray-700">
                    {c.t26}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {c.t27}
                  </h3>
                  <p className="text-gray-700">
                    {c.t28}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {c.t29}
                  </h3>
                  <p className="text-gray-700">
                    {c.t30}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {c.t31}
                  </h3>
                  <p className="text-gray-700">
                    {c.t32}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-800 mb-4">
                {c.t33}
              </h2>
              <nav className="space-y-2">
                <a href="/project/overview" className="block px-4 py-2 bg-blue-50 text-blue-900 rounded-md font-medium">
                  {c.t34}
                </a>
                <a href="/project/route" className="block px-4 py-2 hover:bg-gray-50 text-gray-700 hover:text-blue-900 rounded-md transition-all">
                  {c.t35}
                </a>
                <a href="/project/technology" className="block px-4 py-2 hover:bg-gray-50 text-gray-700 hover:text-blue-900 rounded-md transition-all">
                  {c.t36}
                </a>
                <a href="/project/impact" className="block px-4 py-2 hover:bg-gray-50 text-gray-700 hover:text-blue-900 rounded-md transition-all">
                  {c.t37}
                </a>
                <a href="/project/timeline" className="block px-4 py-2 hover:bg-gray-50 text-gray-700 hover:text-blue-900 rounded-md transition-all">
                  {c.t38}
                </a>
              </nav>
            </div>
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-800 mb-4">
                {c.t39}
              </h2>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="flex items-center text-gray-700 hover:text-blue-900">
                    <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    {c.t40}
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center text-gray-700 hover:text-blue-900">
                    <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    {c.t41}
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center text-gray-700 hover:text-blue-900">
                    <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    {c.t42}
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center text-gray-700 hover:text-blue-900">
                    <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    {c.t43}
                  </a>
                </li>
              </ul>
            </div>
            <div className="bg-blue-900 text-white rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                {c.t44}
              </h2>
              <p className="mb-4 text-white/80">
                {c.t45}
              </p>
              <a href="/contact" className="inline-block bg-orange-500 hover:bg-orange-400 text-white px-6 py-2 rounded-md transition-all">
                {c.t46}
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
