/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output so the app can be built LOCALLY and run on cPanel's
  // Node.js app (Passenger) without running `next build` / `npm install` on
  // the memory-limited shared host.
  output: 'standalone',
  async redirects() {
    return [
      {
        source: '/about-project',
        destination: '/project/overview',
        permanent: true,
      },
      {
        source: '/expressway-route',
        destination: '/routes-facilities',
        permanent: true,
      },
      {
        source: '/virtual-tour',
        destination: '/',
        permanent: true,
      },
      {
        source: '/project/technology',
        destination: '/project/overview',
        permanent: true,
      },
      {
        source: '/about-project/',
        destination: '/project/overview',
        permanent: true,
      },
      {
        source: '/expressway-route/',
        destination: '/routes-facilities',
        permanent: true,
      },
      {
        source: '/virtual-tour/',
        destination: '/',
        permanent: true,
      },
      {
        source: '/project/technology/',
        destination: '/project/overview',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
