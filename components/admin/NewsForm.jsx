'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { saveNewsAction, uploadImageAction } from '../../app/admin/actions';

export default function NewsForm({ post }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [imageUrl, setImageUrl] = useState(post?.image || '');

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setStatus({ type: '', message: '' });

    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await uploadImageAction(fd);
      if (res?.ok && res.path) {
        setImageUrl(res.path);
        setStatus({ type: 'success', message: 'Image uploaded successfully.' });
      } else {
        setStatus({ type: 'error', message: res?.error || 'Upload failed' });
      }
    } catch {
      setStatus({ type: 'error', message: 'Image upload failed' });
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });

    const fd = new FormData(e.currentTarget);
    if (imageUrl) {
      fd.set('image', imageUrl);
    }

    try {
      const res = await saveNewsAction(fd);
      if (res?.ok) {
        setStatus({ type: 'success', message: 'Article saved successfully!' });
        router.push('/admin/news');
        router.refresh();
      } else {
        setStatus({ type: 'error', message: res?.error || 'Save failed' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
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

      {post?.id && <input type="hidden" name="id" value={post.id} />}

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5 shadow-sm">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="title">
            Article Title *
          </label>
          <input
            id="title"
            name="title"
            required
            defaultValue={post?.title || ''}
            placeholder="e.g. Dhaka Bypass Expressway Facilitates Unhindered Travel"
            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="slug">
              Slug (URL Identifier)
            </label>
            <input
              id="slug"
              name="slug"
              defaultValue={post?.slug || ''}
              placeholder="auto-generated from title"
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="category">
              Category
            </label>
            <input
              id="category"
              name="category"
              defaultValue={post?.category || 'Operations'}
              placeholder="e.g. Operations, Infrastructure, Transport"
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="source">
              Source / Publication Name
            </label>
            <input
              id="source"
              name="source"
              defaultValue={post?.source || ''}
              placeholder="e.g. Daily Star, New Age, TBS News"
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="published_at">
              Publication Date
            </label>
            <input
              id="published_at"
              name="published_at"
              type="date"
              defaultValue={
                post?.published_at
                  ? new Date(post.published_at).toISOString().slice(0, 10)
                  : new Date().toISOString().slice(0, 10)
              }
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="url">
            External Article / Coverage URL
          </label>
          <input
            id="url"
            name="url"
            type="url"
            defaultValue={post?.url || ''}
            placeholder="https://..."
            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="excerpt">
            Short Summary / Excerpt
          </label>
          <textarea
            id="excerpt"
            name="excerpt"
            rows="3"
            defaultValue={post?.excerpt || ''}
            placeholder="Brief overview displayed on the news card..."
            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Article Banner Image
          </label>
          <div className="flex items-center gap-4 flex-wrap">
            <input
              name="image"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="/uploads/banner.webp or public path"
              className="flex-1 min-w-[240px] px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            />
            <label className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-semibold cursor-pointer transition-all border border-gray-300 shrink-0">
              {uploading ? 'Uploading…' : 'Upload file'}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
          {imageUrl && (
            <div className="mt-3">
              <img
                src={imageUrl}
                alt="Preview"
                className="h-28 w-auto rounded border border-gray-200 object-cover"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="body">
            Full Article Content (Optional)
          </label>
          <textarea
            id="body"
            name="body"
            rows="6"
            defaultValue={post?.body || ''}
            placeholder="Full text / Markdown / details if hosting internal post..."
            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <input
            id="is_published"
            name="is_published"
            type="checkbox"
            value="1"
            defaultChecked={post ? Boolean(post.is_published) : true}
            className="w-4 h-4 text-orange-500 rounded focus:ring-orange-400"
          />
          <label htmlFor="is_published" className="text-sm font-semibold text-gray-700 cursor-pointer">
            Published (Visible to public visitors)
          </label>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white px-6 py-2.5 rounded-md font-semibold transition-all"
        >
          {saving ? 'Saving…' : post?.id ? 'Update Article' : 'Create Article'}
        </button>
        <Link
          href="/admin/news"
          className="px-4 py-2.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold text-sm transition-all"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
