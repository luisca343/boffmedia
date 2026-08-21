module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['tsconfig.json', 'tsconfig.spec.json'],
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
    }],
    "prettier/prettier": ["error",{
      "endOfLine": "auto"}
    ],
    // The separator is written as an escape and the patterns built with String.raw:
    // esquery ends an attribute regex at the first literal slash.
    // The read-only asset tree and the laboon store are reached only through
    // config/paths.ts: a second way to build those roots is a second thing to
    // change when a mount moves, and the one that gets forgotten.
    'no-restricted-syntax': [
      'error',
      {
        selector: String.raw`CallExpression[callee.property.name='join'] > Literal[value=/^(public|laboon)(\u002F|$)/]`,
        message:
          "Build asset paths with publicPath()/laboonPath() from '@/config/paths', not by joining 'public'/'laboon' yourself.",
      },
      {
        selector: String.raw`BinaryExpression[operator='+'] > Literal[value=/(^|\u002F)(public|laboon)\u002F/]`,
        message:
          "Build asset paths with publicPath()/laboonPath() from '@/config/paths', not by concatenating 'public'/'laboon'.",
      },
      {
        selector: String.raw`TemplateLiteral > TemplateElement[value.raw=/(^|\u002F)(public|laboon)\u002F/]`,
        message:
          "Build asset paths with publicPath()/laboonPath() from '@/config/paths', not by interpolating 'public'/'laboon'.",
      },
    ],
    // remove annoying rules
  },
  overrides: [
    {
      // The one module allowed to name those roots.
      files: ['src/config/paths.ts'],
      rules: { 'no-restricted-syntax': 'off' },
    },
  ],
};