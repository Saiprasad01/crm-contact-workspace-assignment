// eslint-config-next v16 ships native flat-config arrays directly — no
// FlatCompat bridging needed (and FlatCompat currently chokes on a circular
// reference inside eslint-plugin-react's flat config when used this way).
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: ['build/**', 'out/**', '.next/**', 'node_modules/**'],
  },
  {
    rules: {
      // This project deliberately has no data-fetching library (see
      // PROJECT_IMPLEMENTATION_PLAN.md Assumption 7) — every hook manages
      // its own loading/error/data state with plain `useState` +
      // `useEffect`, the standard pattern this rule now discourages in
      // favor of a library or `useSyncExternalStore`. Adopting either would
      // contradict that deliberate choice, so this rule is off project-wide
      // rather than disabled line-by-line at every data hook.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
];

export default eslintConfig;
