import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  distDir: 'build',
  // Stray lockfiles in parent folders (unrelated to this project) would
  // otherwise make Next guess the workspace root wrong.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
