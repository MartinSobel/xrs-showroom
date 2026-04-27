import nextVitals from 'eslint-config-next/core-web-vitals'

const eslintConfig = [
  // Global ignores
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'functions/**',
      'next-env.d.ts',
    ],
  },
  ...nextVitals,
  // Override rules for all files (placed AFTER nextVitals to take precedence)
  {
    rules: {
      // ─── Relaxed for existing JS codebase ───
      'no-console': 'off',
      'react/no-unescaped-entities': 'off',
      '@next/next/no-img-element': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

      // ─── Relaxed React rules ───
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      // Three.js material mutations are intentional, not React state
      'react-hooks/immutability': 'warn',

      // ─── Next.js relaxed ───
      '@next/next/no-assign-module-variable': 'off',
    },
  },
]

export default eslintConfig
