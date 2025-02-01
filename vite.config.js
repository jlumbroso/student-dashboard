import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  // If your GitHub Pages URL is https://<username>.github.io/student-dashboard/,
  // the base must match:
  base: '/student-dashboard/',
  plugins: [svelte()]
});
