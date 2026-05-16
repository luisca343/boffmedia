import nextConfig from 'eslint-config-next/core-web-vitals'

export default [
  ...nextConfig,
  {
    rules: {
      '@next/next/no-img-element': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
]
