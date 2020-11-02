module.exports = {
  roots: ['./src/lib'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  collectCoverage: true,
  collectCoverageFrom: ['**/*.{ts,tsx}'],
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
}
