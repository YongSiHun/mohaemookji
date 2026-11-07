import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import maintainability from './scripts/eslint-rules.js';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'artifacts/**',
      '.yarn/**',
      '.npm-cache/**',
      '.wrangler/**',
      '.wrangler-config/**',
      '.husky/_/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { languageOptions: { globals: { ...globals.node, ...globals.browser } } },
  {
    files: ['src/**/*.{ts,tsx}', 'scripts/**/*.{ts,js}', 'vite.config.ts'],
    plugins: { maintainability },
    rules: {
      'maintainability/cognitive-complexity': ['error', 5],
      'maintainability/flat-control-flow': 'error',
      complexity: ['error', { max: 10, variant: 'modified' }],
      'max-depth': ['error', 2],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'IfStatement[test.type!="Identifier"]',
          message: '조건식을 의미 있는 boolean 변수로 선언한 뒤 사용하세요.',
        },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': hooks },
    rules: hooks.configs.recommended.rules,
  },
  {
    files: ['src/{components,pages,hooks}/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/repositories/**', '**/data/**'],
              message: 'UI는 서비스 계층을 통해 데이터에 접근하세요.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/services/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/components/**',
                '**/pages/**',
                '**/hooks/**',
                '**/browser/**',
                '**/data/**',
              ],
              message: '서비스는 UI나 원본 데이터에 의존하지 않습니다.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/repositories/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/services/**', '**/components/**', '**/pages/**', '**/hooks/**'],
              message: '저장소는 상위 서비스와 UI에 의존하지 않습니다.',
            },
          ],
        },
      ],
    },
  },
);
