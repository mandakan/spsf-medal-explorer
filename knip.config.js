/** @type {import('knip').KnipConfig} */
export default {
  // Vite entrypoints
  entry: ['index.html', 'src/main.jsx'],

  // Source files
  project: ['src/**/*.{js,jsx}'],

  // Jest tests
  jest: {
    config: ['jest.config.js']
  },

  // Ignore build artifacts
  ignore: ['dist/**', 'coverage/**', 'node_modules/**']
}
