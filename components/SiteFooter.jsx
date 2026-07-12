import Link from 'next/link';
import { MapPin, Mail, Phone } from 'lucide-react';

/** Site footer. Markup matches the original export exactly; content from `site.footer`. */
export default function SiteFooter({ content }) {
  const {
    brand = {},
    quickLinksHeading,
    quickLinks = [],
    contactHeading,
    contact = {},
    newsletter = {},
    copyright,
    legalLinks = [],
  } = content || {};

  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center overflow-hidden mr-3">
                <img src={brand.logo} alt="Logo" className="w-9 h-9" />
              </div>
              <div>
                <div className="font-bold">{brand.name}</div>
                <div className="text-xs text-gray-400">{brand.tagline}</div>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-6">{brand.description}</p>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">{quickLinksHeading}</h3>
            <ul className="space-y-2 text-gray-400">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white transition-all">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">{contactHeading}</h3>
            <ul className="space-y-4 text-gray-400">
              <li className="flex items-start">
                <MapPin className="w-5 h-5 mr-3 mt-1 text-orange-500" />
                <span>
                  {contact.addressLine1}
                  <br />
                  {contact.addressLine2}
                </span>
              </li>
              <li className="flex items-center">
                <Mail className="w-5 h-5 mr-3 text-orange-500" />
                <a href={`mailto:${contact.email}`} className="hover:text-white transition-all">
                  {contact.email}
                </a>
              </li>
              <li className="flex items-center">
                <Phone className="w-5 h-5 mr-3 text-orange-500" />
                <a href={contact.phoneHref} className="hover:text-white transition-all">
                  {contact.phoneDisplay}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">{newsletter.heading}</h3>
            <p className="text-gray-400 text-sm mb-4">{newsletter.text}</p>
            <form className="space-y-3">
              <div>
                <input
                  type="email"
                  placeholder={newsletter.placeholder}
                  className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-md transition-all"
              >
                {newsletter.button}
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-sm text-gray-400 flex flex-col md:flex-row justify-between items-center">
          <div>{copyright}</div>
          <div className="mt-4 md:mt-0 flex space-x-6">
            {legalLinks.map((label) => (
              <p key={label}>{label}</p>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
