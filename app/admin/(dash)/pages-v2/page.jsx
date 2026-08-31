// app/admin/(dash)/pages-v2/page.jsx
import Link from 'next/link';
import { listPagesAction, createPageAction, deletePageAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function PageTree() {
  const pages = await listPagesAction();

  return (
    <div className="p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Pages</h1>
        <p className="text-sm text-gray-500">Every page on the new site and its address.</p>
      </header>

      <form action={createPageAction} className="flex flex-wrap gap-3 items-end">
        <label className="flex flex-col text-sm">
          Title
          <input name="title" required className="border rounded px-3 py-2" />
        </label>
        <label className="flex flex-col text-sm">
          Address (optional)
          <input name="slug" placeholder="travel/toll" className="border rounded px-3 py-2" />
        </label>
        <button type="submit" className="px-4 py-2 rounded bg-black text-white">Create page</button>
      </form>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">Title</th><th>Address</th><th>Status</th><th></th>
          </tr>
        </thead>
        <tbody>
          {pages.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="py-2">
                <Link href={`/admin/pages-v2/${p.id}`} className="underline">{p.title || '(untitled)'}</Link>
              </td>
              <td><code>/{p.slug}</code></td>
              <td>{p.status}</td>
              <td className="text-right">
                <form action={deletePageAction}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="slug" value={p.slug} />
                  <button type="submit" className="text-red-600">Delete</button>
                </form>
              </td>
            </tr>
          ))}
          {pages.length === 0 && (
            <tr><td colSpan={4} className="py-6 text-gray-500">No pages yet. Create the first one above.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
