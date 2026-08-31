'use client';

import { useState } from 'react';
import { submitContactAction } from '../app/admin/actions';

export default function ContactForm({ labels }) {
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await submitContactAction(formData);
      if (res?.ok) {
        setStatus({
          type: 'success',
          message: 'Thank you! Your message has been sent successfully. We will get back to you soon.',
        });
        form.reset();
      } else {
        setStatus({
          type: 'error',
          message: res?.error || 'Failed to send your message. Please try again.',
        });
      }
    } catch {
      setStatus({
        type: 'error',
        message: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {status.message && (
        <div
          className={`p-4 rounded-md text-sm ${
            status.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {status.message}
        </div>
      )}

      <div>
        <label className="block text-gray-700 mb-2" htmlFor="name">
          {labels?.name || 'Your Name'}
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your name"
        />
      </div>

      <div>
        <label className="block text-gray-700 mb-2" htmlFor="email">
          {labels?.email || 'Your Email'}
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your email"
        />
      </div>

      <div>
        <label className="block text-gray-700 mb-2" htmlFor="subject">
          {labels?.subject || 'Subject'}
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter subject"
        />
      </div>

      <div>
        <label className="block text-gray-700 mb-2" htmlFor="message">
          {labels?.message || 'Message'}
        </label>
        <textarea
          id="message"
          name="message"
          rows="5"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type your message here..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white px-6 py-3 rounded-md transition-all font-semibold"
      >
        {loading ? 'Sending…' : labels?.button || 'Send Message'}
      </button>
    </form>
  );
}
