import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // Downgraded from error: resetting state on route change / after hydration /
      // on query change are intentional patterns in this codebase.
      'react-hooks/set-state-in-effect': 'warn',
      // Downgraded from error: dragIdx.current read during render to style drag
      // targets — cosmetic only, not a correctness bug.
      'react-hooks/refs': 'warn',
      // Downgraded from error: Date.now() used as `min` attribute for a datetime
      // input — value changes per render are harmless here.
      'react-hooks/purity': 'warn',
    },
  },
]

export default eslintConfig
