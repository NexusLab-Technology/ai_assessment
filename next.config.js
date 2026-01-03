/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    AUTH_ENABLED: process.env.AUTH_ENABLED,
    SESSION_TIMEOUT: process.env.SESSION_TIMEOUT,
  },
}

module.exports = nextConfig