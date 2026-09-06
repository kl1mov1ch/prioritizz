import base from '@prioritizz/config/eslint/base';

export default [
  ...base,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
