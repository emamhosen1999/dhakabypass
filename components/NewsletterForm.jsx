'use client';

import { useState } from 'react';
import { subscribeNewsletterAction } from '../app/admin/actions';

export default function NewsletterForm({ buttonText = 'Subscribe' }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const fd = new FormData();
      fd.append('email', email);
      const res = await subscribeNewsletterAction(fd);
      if (res?.ok) {
        setStatus({
          type: 'success',
          message: 'Thank you for subscribing to updates!',
        });
        setEmail('');
      } else {
        setStatus({
          type: 'error',
          message: res?.error || 'Subscription failed. Please check your email.',
        });
      }
    } catch {
      setStatus({
        type: 'error',
        message: 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Your email address"
          className="px-4 py-3 rounded-md flex-grow bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white px-6 py-3 rounded-md transition-all font-semibold whitespace-nowrap"
        >
          {loading ? 'Subscribing…' : buttonText}
        </button>
      </form>
      {status.message && (
        <p
          className={`mt-3 text-sm font-medium ${
            status.type === 'success' ? 'text-green-300' : 'text-red-300'
          }`}
        >
          {status.message}
        </p>
      )}
    </div>
  );
}
