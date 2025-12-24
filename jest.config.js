export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest'
  },
  // Allow transforming ESM packages from the remark/react-markdown ecosystem
  transformIgnorePatterns: [
    '/node_modules/(?!remark-gfm|react-markdown|mdast-util-[^/]+|micromark[^/]*|unist-util-[^/]+|hast-util-[^/]+|property-information|vfile|bail|trough|is-plain-obj)/'
  ],
  testMatch: ['**/tests/**/*.test.js']
}
