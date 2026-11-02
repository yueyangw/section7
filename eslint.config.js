import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', '.astro', '.cache', 'node_modules', 'design-ref', 'src/content'] },
  ...tseslint.configs.recommended,
  { rules: { '@typescript-eslint/no-explicit-any': 'off' } },
);
