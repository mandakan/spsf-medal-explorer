/** @type {import('knip').KnipConfig} */
export default {
  // Vite entrypoints + service worker
  entry: ['index.html', 'src/main.jsx', 'public/service-worker.js'],

  // Source files
  project: ['src/**/*.{js,jsx}'],

  // Jest tests
  jest: {
    config: ['jest.config.js']
  },

  // Ignore build artifacts
  ignore: ['dist/**', 'coverage/**', 'node_modules/**'],

  // Tailwind is used via CSS/@tailwindcss/vite; Knip may not detect it.
  ignoreDependencies: ['tailwindcss']
}
