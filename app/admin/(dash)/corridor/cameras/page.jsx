import Link from 'next/link';
import { assertCan } from '../../../../../lib/auth/assert-can';
import { listCameras } from '../../../../../lib/cameras/repo';
import { formatChainage } from '../../../../../lib/corridor/chainage';
import { saveCameraAction, deleteCameraAction, testCameraAction } from './actions';

export const dynamic = 'force-dynamic';

const input = 'w-full border rounded px-2 py-1';

function CameraForm({ camera }) {
  const key = camera ? JSON.stringify([camera.names, camera.snapshot_url, camera.stream_url, camera.is_active, camera.is_sample, camera.sort_order]) : 'new';
  return (
    <form key={key} action={saveCameraAction} className="grid gap-3 sm:grid-cols-3">
      <input type="hidden" name="id" value={camera?.id ?? ''} />
      {[['en', 'English'], ['bn', 'বাংলা'], ['zh', '中文']].map(([l, label]) => (
        <label key={l} className="flex flex-col text-sm">Name ({label})
          <input name={`name.${l}`} defaultValue={camera?.names?.[l] ?? ''} required={l === 'en'} className={input} />
        </label>
      ))}
      <label className="flex flex-col text-sm">Chainage
        <input name="chainage_m" defaultValue={camera?.chainage_m ?? ''} placeholder="3218 (metres)" className={input} />
      </label>
      <label className="flex flex-col text-sm">Direction / view
        <input name="direction" defaultValue={camera?.direction ?? ''} placeholder="Northbound" className={input} />
      </label>
      <label className="flex flex-col text-sm">Display order
        <input name="sort_order" type="number" min="0" defaultValue={camera?.sort_order ?? 0} className={input} />
      </label>
      <label className="flex flex-col text-sm">Latitude
        <input name="lat" defaultValue={camera?.lat ?? ''} className={input} />
      </label>
      <label className="flex flex-col text-sm">Longitude
        <input name="lng" defaultValue={camera?.lng ?? ''} className={input} />
      </label>
      <label className="flex flex-col text-sm">Still refresh (seconds)
        <input name="refresh_seconds" type="number" min="5" max="600" defaultValue={camera?.refresh_seconds ?? 30} className={input} />
      </label>
      <label className="flex flex-col text-sm sm:col-span-3">Snapshot address (JPEG)
        <input name="snapshot_url" defaultValue={camera?.snapshot_url ?? ''} placeholder="http://10.0.0.21/ISAPI/Streaming/channels/101/picture" className={input} />
      </label>
      <label className="flex flex-col text-sm sm:col-span-2">Live stream address (HLS .m3u8)
        <input name="stream_url" defaultValue={camera?.stream_url ?? ''} placeholder="https://nvr.example/live/cam21/index.m3u8" className={input} />
      </label>
      <label className="flex flex-col text-sm">Stream delivery
        <select name="delivery" defaultValue={camera?.delivery ?? 'proxy'} className={input}>
          <option value="proxy">Through this website (hides the camera)</option>
          <option value="direct">Direct from a public https stream</option>
        </select>
      </label>
      <label className="flex flex-col text-sm">Camera username
        <input name="username" defaultValue={camera?.username ?? ''} autoComplete="off" className={input} />
      </label>
      <label className="flex flex-col text-sm">Camera password
        <input name="password" type="password" autoComplete="new-password" placeholder={camera?.has_password ? 'Stored — type to replace' : ''} className={input} />
      </label>
      <div className="flex flex-col gap-1 text-sm justify-end">
        <label className="flex items-center gap-2"><input type="checkbox" name="is_active" defaultChecked={camera ? camera.is_active : true} /> Shown on the website</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="is_sample" defaultChecked={camera ? camera.is_sample : false} /> Sample (placeholder picture)</label>
      </div>
      <div className="sm:col-span-3"><button type="submit" className="px-4 py-2 rounded bg-black text-white">Save camera</button></div>
    </form>
  );
}

/**
 * CCTV cameras. Each camera's still and live stream are fetched by the
 * website server and relayed to visitors, so a camera on a private network or
 * behind a password is never exposed; the password is stored encrypted.
 */
export default async function CamerasAdmin() {
  await assertCan('edit_blocks');
  const cameras = await listCameras();
  return (
    <div className="p-6 space-y-8 max-w-5xl">
      <header className="space-y-2">
        <Link href="/admin/corridor" className="text-sm underline">Corridor data</Link>
        <h1 className="text-2xl font-bold">Traffic cameras</h1>
        <p className="text-sm text-gray-600">
          Shown by every “Traffic cameras” block (the travel cameras page). A camera needs a snapshot address that
          returns a JPEG, a live stream address that returns an HLS playlist (.m3u8), or both. Most NVRs (Hikvision,
          Dahua, Uniview, Milestone) can publish both; the supplier gives the addresses. Use “Test now” after saving.
        </p>
      </header>
      {cameras.map((c) => (
        <section key={c.id} className="border rounded p-4 space-y-3 bg-white">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <strong className="text-base">{c.names.en}</strong>
            {c.chainage_m !== null ? <span>{formatChainage(c.chainage_m)}</span> : null}
            {c.is_sample ? <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900">Sample</span> : null}
            {!c.is_active ? <span className="px-2 py-0.5 rounded bg-gray-100">Hidden</span> : null}
            <span className={c.last_error ? 'text-red-700' : 'text-gray-600'}>
              {c.last_error ? `Last check failed: ${c.last_error}` : c.last_ok_at ? `Last answered ${new Date(c.last_ok_at).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' })}` : 'Not checked yet'}
            </span>
          </div>
          <CameraForm camera={c} />
          <div className="flex gap-4">
            <form action={testCameraAction}><input type="hidden" name="id" value={c.id} /><button type="submit" className="px-3 py-1 border rounded text-sm">Test now</button></form>
            <form action={deleteCameraAction}><input type="hidden" name="id" value={c.id} /><button type="submit" className="text-red-700 text-sm underline" data-confirm={`Delete the camera "${c.names?.en || c.id}"?\n\nIts tile leaves the public page. It goes to the trash with its settings and can be restored.`}>Delete this camera</button></form>
          </div>
        </section>
      ))}
      <section className="border rounded p-4 space-y-3 bg-white">
        <h2 className="font-semibold">Add a camera</h2>
        <CameraForm />
      </section>
    </div>
  );
}
