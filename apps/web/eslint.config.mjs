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
        patterns: [
          {
            group: ['@/components/boffmedia/primitives/*'],
            message: 'Import boffmedia v3 primitives from the barrel `@/components/boffmedia/primitives` (BOFFMEDIA_V3.md §1), not by deep path.',
          },
          {
            group: ['@/components/ui/primitives', '@/components/ui/primitives/*'],
            message: 'The legacy shadcn layer is deprecated. Use @boffmedia/ui (packages/ui) instead. See CLAUDE.md.',
          },
        ],
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
  {
    // RATCHET: exempt the primitives layer itself so internal cross-imports stay legal.
    // Entries in this block must not be added to; they can only be removed as files migrate
    // to @boffmedia/ui.
    files: ['src/components/ui/primitives/**'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    // RATCHET: exempt existing consumers of the legacy layer. Entries in this list may only
    // be REMOVED as files migrate to @boffmedia/ui, never added. New files must use
    // @boffmedia/ui (packages/ui).
    files: [
      'src/app/(boffmedia)/error.tsx',
      'src/app/(clones)/ciclosimitacion/dbunit/_components/Content.tsx',
      'src/app/(clones)/ciclosimitacion/page.tsx',
      'src/app/not-found.tsx',
      'src/app/smartrotom/bidkea/page.tsx',
      'src/app/smartrotom/camara/_components/CameraBottomControls.tsx',
      'src/app/smartrotom/camara/_components/CameraControls.tsx',
      'src/app/smartrotom/camara/_components/CameraZoomSlider.tsx',
      'src/app/smartrotom/camara/_components/GalleryView.tsx',
      'src/app/smartrotom/camara/_components/ScreenshotPreviewDialog.tsx',
      'src/app/smartrotom/mina/drops/page.tsx',
      'src/app/smartrotom/mina/jugar/page.tsx',
      'src/app/wingull/_components/MovingSection.tsx',
      'src/app/wingull/invitacion/\\[id\\]/_components/InvitacionForm.tsx',
      'src/app/wingull/invitacion/\\[id\\]/_components/InvitacionNoEncontrada.tsx',
      'src/app/wingull/invitacion/\\[id\\]/_components/InvitacionUsada.tsx',
      'src/app/wingull/page.tsx',
      'src/app/wingull/pueblos/_components/PueblosView.tsx',
      'src/components/boffmedia/ui/navigation/NotificationPreferences.tsx',
      'src/features/ficusai/components/BiomeListCard.tsx',
      'src/features/ficusai/components/ChatInput.tsx',
      'src/features/ficusai/components/CompletePokemonCard.tsx',
      'src/features/ficusai/components/MessageBubble.tsx',
      'src/features/ficusai/components/MoveData.tsx',
      'src/features/ficusai/components/MoveEffect.tsx',
    ],
    rules: { 'no-restricted-imports': 'off' },
  },
]
