import { getContent } from '../../lib/content';

export const dynamic = 'force-dynamic';

/**
 * contact — reconstructed from the original site's live DOM.
 * All copy and imagery comes from content key "page.contact" so the admin
 * panel can edit every field.
 */
export default async function ContactPage() {
  const c = await getContent('page.contact');
  return (
    <>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-blue-900 mb-6">
          {c.t1}
        </h1>
        <p className="text-gray-700 mb-8">
          {c.t2}
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <div className="bg-white shadow-lg rounded-lg p-8">
              <h2 className="text-2xl font-semibold text-blue-800 mb-6">
                {c.t3}
              </h2>
              <form className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="name">
                    {c.t4}
                  </label>
                  <input type="text" id="name" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter your name" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="email">
                    {c.t5}
                  </label>
                  <input type="email" id="email" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter your email" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="subject">
                    {c.t6}
                  </label>
                  <input type="text" id="subject" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter subject" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="message">
                    {c.t7}
                  </label>
                  <textarea id="message" rows="5" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Type your message here..." />
                </div>
                <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-md transition-all">
                  {c.t8}
                </button>
              </form>
            </div>
          </div>
          <div>
            <div className="bg-white shadow-lg rounded-lg p-8 mb-8">
              <h2 className="text-2xl font-semibold text-blue-800 mb-6">
                {c.t9}
              </h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-800">
                      {c.t10}
                    </h3>
                    <p className="text-gray-600">
                      {c.t11}
                      <br />
                      {c.t12}
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-800">
                      {c.t13}
                    </h3>
                    <p className="text-gray-600">
                      {c.t14}
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-800">
                      {c.t15}
                    </h3>
                    <p className="text-gray-600">
                      {c.t16}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-64 bg-gray-200 rounded-lg">
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <iframe src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d1130.064316792673!2d90.41835627574073!3d23.803354222247798!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMjPCsDQ4JzEyLjEiTiA5MMKwMjUnMTAuNSJF!5e1!3m2!1sen!2sca!4v1744865338766!5m2!1sen!2sca" allowfullscreen="" referrerpolicy="no-referrer-when-downgrade" className="w-full h-full rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
