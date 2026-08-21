import nextConfig from 'eslint-config-next/core-web-vitals'

// `\u002F` stands in for the path separator: esquery ends an attribute regex at
// the first literal slash, so the escape is what keeps the pattern parseable.
const ASSET_LITERAL =
  String.raw`/(^|url\()\u002F(smartrotom\u002F(img|packs|data|audio|armourers|combates)|boffmedia|uploads|jcef|blog)\u002F/`
const ASSET_MESSAGE =
  "Build asset URLs with staticAsset(ASSET.x, ...) from '@/lib/assets', not a bare path literal. Route hrefs are unaffected."

export default [
  ...nextConfig,
  {
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['@/components/boffmedia/primitives/*'],
          message: 'Import boffmedia v3 primitives from the barrel `@/components/boffmedia/primitives` (BOFFMEDIA_V3.md §1), not by deep path.',
        }],
      }],
      '@next/next/no-img-element': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/static-components': 'off',
      'react/jsx-no-comment-textnodes': 'off',
      // Asset URLs are built from the shared prefixes so the whole tree can
      // change origin at once; a bare literal here is one that would be left
      // behind. Scoped to asset contexts only — route hrefs are not assets.
      'no-restricted-syntax': ['error',
        {
          selector: `JSXAttribute[name.name='src'] > Literal[value=${ASSET_LITERAL}]`,
          message: ASSET_MESSAGE,
        },
        {
          selector: `JSXAttribute[name.name='src'] > JSXExpressionContainer > TemplateLiteral > TemplateElement:first-child[value.raw=${ASSET_LITERAL}]`,
          message: ASSET_MESSAGE,
        },
        {
          selector: `CallExpression[callee.name='fetch'] > Literal:first-child[value=${ASSET_LITERAL}]`,
          message: ASSET_MESSAGE,
        },
        {
          selector: `CallExpression[callee.name='fetch'] > TemplateLiteral:first-child > TemplateElement:first-child[value.raw=${ASSET_LITERAL}]`,
          message: ASSET_MESSAGE,
        },
        {
          selector: `Property[key.name=/^(src|backgroundImage)$/] > Literal[value=${ASSET_LITERAL}]`,
          message: ASSET_MESSAGE,
        },
      ],
    },
  },
  {
    // The one module allowed to turn a prefix into a URL.
    files: ['src/lib/assets.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
]
