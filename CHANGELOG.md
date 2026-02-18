# Changelog

All notable changes to this project will be documented in this file.

## [1.16.8](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/compare/v1.16.7...v1.16.8) (2026-02-18)


### Bug Fixes

* **rule:** accept any expression type for styling variable inits ([77d894f](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/commit/77d894fb1ed48063c36bd645eba805f3925d49ad))

## [1.16.7](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/compare/v1.16.6...v1.16.7) (2026-02-18)


### Bug Fixes

* **rule:** apply branded type checks to template literals ([f0391f2](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/commit/f0391f2f5544e57a886e122ccb453711304b280c))

## [1.16.6](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/compare/v1.16.5...v1.16.6) (2026-02-18)


### Bug Fixes

* **rule:** resolve method name from chained calls in getCalleeName ([c88abe2](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/commit/c88abe2b28b39acd1526bb3bfbc34954b038b7eb))

## [1.16.5](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/compare/v1.16.4...v1.16.5) (2026-02-18)


### Bug Fixes

* **rule:** always ignore string literal object keys ([4d43240](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/commit/4d4324036329360e9b8b5f9baa5aa1cb479d4198))

## [1.16.4](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/compare/v1.16.3...v1.16.4) (2026-02-18)


### Bug Fixes

* **rule:** handle template literals with type assertions and style assignments ([0d5b354](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/commit/0d5b35468e0624a359e74256d436a87b0af13cdf))

## [1.16.3](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/compare/v1.16.2...v1.16.3) (2026-02-18)


### Bug Fixes

* **rule:** recognize styling variables with string init and += assignment ([acaa990](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/commit/acaa99086a99bde2b353a55e67d36fb0768568fd))

## [1.16.2](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/compare/v1.16.1...v1.16.2) (2026-02-18)


### Bug Fixes

* **rule:** skip prefer-trans-in-jsx inside SVG text-only elements ([21fac23](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/commit/21fac23c6fa34ce82b278168b0776b5d9c0d913a))

## [1.16.1](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/compare/v1.16.0...v1.16.1) (2026-02-17)


### Bug Fixes

* **rule:** apply ClassName handling via suffix path ([f2126c8](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/commit/f2126c8d1700536d392e9728ff81347b08833a0a))

## [1.16.0](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/compare/v1.15.3...v1.16.0) (2026-02-17)


### Features

* **no-unlocalized-strings:** expand technical property heuristics ([d1ca76c](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/commit/d1ca76c7f373eb6776e3b14c2b16fdfc1f076b7a))
* **rule:** ignore replace search argument on string receivers ([bae4399](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/commit/bae43992b179a55595dd16241c22c83b8d2496c5))


### Bug Fixes

* ignore sizes and imageSizes properties in no-unlocalized-strings ([e92ae4f](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/commit/e92ae4ff0f853d00b79d97592dc654569993b975))
* **no-unlocalized-strings:** honor ignoreNames and extend technical suffixes ([963971f](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/commit/963971fccacd00f466beee05161618c26e156979))
* **no-unlocalized-strings:** ignore css unit values ([4e28ff4](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/commit/4e28ff42086a870f6b81a953de1f9d4059c63249))
* **no-unlocalized-strings:** ignore string-search fragments ([d1e2a75](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/commit/d1e2a75ca0c54197582093e4d84bb39443c1e090))

## [1.15.3](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/compare/v1.15.2...v1.15.3) (2026-02-16)


### Bug Fixes

* ignore template literals with no meaningful static text ([3fc3dff](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/commit/3fc3dff2afb1fbc6c7cb56bd06e0189bd277592a))

## [1.15.2](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/compare/v1.15.1...v1.15.2) (2026-02-16)


### Bug Fixes

* ignore ISO 8601 date/time values in no-unlocalized-strings ([5c599ca](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/commit/5c599cad1a827a9e10a72f051062d5b69e98b097))

## [1.15.1](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/compare/v1.15.0...v1.15.1) (2026-02-16)


### Bug Fixes

* reduce false positives for CSS values and protocol URLs ([245da05](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/commit/245da05583e5be9062c7146504535232b820bae4)), closes [#16](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/issues/16)

## [1.15.0](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/compare/v1.14.0...v1.15.0) (2026-02-12)


### Features

* add auto-fix for consistent-plural-format and update docs ([674417b](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/commit/674417b588a33f557fa33739fdd977ae717ba14e))
* add OXLint compatibility smoke test and documentation ([8990b35](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/commit/8990b35d99ec136e573f7cee4afde1a9734257e5))


### Bug Fixes

* 8/8 rules work with OXLint, not just 6 ([4421604](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/commit/44216043204b335a70912dfe219f94c69a848a78))

## [1.14.0](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/compare/v1.13.0...v1.14.0) (2026-02-11)


### Features

* make UnlocalizedRecord generic for typed keys ([da84b8d](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/commit/da84b8df3c10ac15806fa50859c9e6ba558dc1fa))

## [1.13.0](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/compare/v1.12.1...v1.13.0) (2026-02-11)


### Features

* add UnlocalizedRecord convenience type for key-value maps ([6df407d](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/commit/6df407d482d2f380f029956210bdc03d6a99759d))

## [1.12.1](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/compare/v1.12.0...v1.12.1) (2026-02-11)


### Bug Fixes

* skip type-only imports when adding Trans import ([112b492](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/commit/112b492494dea9821934e496255b752a7ba4a176))

## [1.12.0](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/compare/v1.11.0...v1.12.0) (2026-02-11)


### Features

* add auto-fix to wrap JSX text with &lt;Trans&gt; ([94f7cb8](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/commit/94f7cb8f37aeb1f7d20871197736cff16963e790))
* add prefer-trans-in-jsx rule with auto-fix ([9f76a6f](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/commit/9f76a6fcd6e3c3bd94fac75e67268e6e7b066822))

## [1.11.0](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/compare/v1.10.1...v1.11.0) (2026-02-10)


### Features

* add suggestion fix to remove unnecessary type assertions ([e72e818](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/commit/e72e818f715bfaf342eea5b278d329dcfcbc092e))

## [1.10.1](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/compare/v1.10.0...v1.10.1) (2026-02-10)


### Bug Fixes

* improve reportUnnecessaryBrands for Record types and object properties ([7a0a8b8](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/commit/7a0a8b81048d867c0e1101ae590b3f85a4c669c4))

## [1.10.0](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/compare/v1.9.0...v1.10.0) (2026-02-10)


### Features

* add reportUnnecessaryBrands option to no-unlocalized-strings ([1d903d4](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/commit/1d903d4257f2c1aa6619078423255e22f732bfe4))

## [1.9.0](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/compare/v1.8.7...v1.9.0) (2026-02-10)


### Features

* ignore strings in binary comparisons in no-unlocalized-strings ([e0286d7](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/commit/e0286d7fcb270a7fd23eeeb0eb8892b3489472d0))

## [1.8.7](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/compare/v1.8.6...v1.8.7) (2026-02-10)


### Bug Fixes

* detect unlocalized template literals in no-unlocalized-strings ([f71f101](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/commit/f71f1018793f8d118f215074662fee80d9140258))

## [1.8.6](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/compare/v1.8.5...v1.8.6) (2026-02-09)


### Bug Fixes

* **no-unlocalized-strings:** allow constrained Record key types ([af3daaf](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/commit/af3daaf8b4d9230ee320608745934aaec950cd7a))
* **no-unlocalized-strings:** honor contextual Record&lt;UnlocalizedKey&gt; keys ([c395c5d](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/commit/c395c5dafbaac86a315935c813efd622f203a984))
* **no-unlocalized-strings:** honor Record&lt;UnlocalizedKey&gt; contextual keys ([e00d4cd](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/commit/e00d4cdf72418192fb445f70e1636212da5fbbd5))
* **no-unlocalized-strings:** support generic "use X" directives ([5e2ae6f](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/commit/5e2ae6fdcd81961eb46cc58fb185dc7dd0a858ae))
* **no-unlocalized-strings:** support generic "use X" directives ([d904623](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/commit/d90462388772f060e1eaadf78aee537aaa76bf2b))

## [1.8.5](///compare/v1.8.4...v1.8.5) (2025-12-05)

### Bug Fixes

* **no-unlocalized-strings:** ignore date/time format strings e02b9d1
* **no-unlocalized-strings:** ignore SVG technical attributes 81715ba

## [1.8.4](///compare/v1.8.3...v1.8.4) (2025-12-05)

### Bug Fixes

* **no-unlocalized-strings:** recognize t() function call syntax 1426d35

## [1.8.3](///compare/v1.8.1...v1.8.3) (2025-12-05)

### Bug Fixes

* bump c7c851b
* **no-unlocalized-strings:** ignore React directives 36d40dc

## [1.8.1](///compare/v1.8.0...v1.8.1) (2025-12-04)

### Bug Fixes

* **no-unlocalized-strings:** ignore directive prologues 6a5cdaa

## [1.8.0](///compare/v1.7.1...v1.8.0) (2025-12-03)

### Features

* added additional release helper 4b72cf2

## [1.7.1](///compare/v1.7.0...v1.7.1) (2025-12-03)

## [1.7.0](///compare/v1.6.0...v1.7.0) (2025-12-03)

### Features

* add GitHub Pages marketing site 49f736c
* **types:** add branded types for marking strings as unlocalized 1f38b6b

### Bug Fixes

* sync plugin version, fix changelog URLs, remove duplicate dep dcacca8

## [1.6.0](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/compare/v1.5.0...v1.6.0) (2025-12-03)

### Features

* **no-unlocalized-strings:** auto-ignore styling helper functions f1dc5ba
* **no-unlocalized-strings:** verify return type of styling helper functions 02acd46

## [1.5.0](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/compare/v1.4.0...v1.5.0) (2025-12-03)

### Features

* **no-unlocalized-strings:** support cn() in styling variable assignments 2741be6

## [1.4.0](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/compare/v1.3.0...v1.4.0) (2025-12-03)

### Features

* **no-unlocalized-strings:** support camelCase styling variable names f0fb00c

## [1.3.0](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/compare/v1.2.2...v1.3.0) (2025-12-03)

### Features

* **no-unlocalized-strings:** support nested classNames objects 20eb965

## [1.2.2](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/compare/v1.2.1...v1.2.2) (2025-12-03)

### Features

* **no-unlocalized-strings:** support className utility functions eda6256

## [1.2.1](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/compare/v1.2.0...v1.2.1) (2025-12-03)

### Features

* **no-unlocalized-strings:** auto-ignore UPPER_CASE styling constants 4d4955a

### Bug Fixes

* **no-unlocalized-strings:** only ignore direct property values in styling constants 1f10da8

## [1.2.0](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/compare/v1.1.1...v1.2.0) (2025-12-03)

### Features

* **no-unlocalized-strings:** auto-ignore camelCase styling properties 8a88bf8
* **no-unlocalized-strings:** skip strings without any letters ceae7a1

## [1.1.1](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/compare/v1.1.0...v1.1.1) (2025-12-03)

### Bug Fixes

* **rules:** check strings inside exported functions 547c27e

## [1.1.0](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/compare/v1.0.1...v1.1.0) (2025-12-02)

### Features

* comprehensive improvements based on original plugin analysis ff963c4

### Bug Fixes

* **no-complex-expressions:** disallow i18n.number/date by default 9d3a10e
* **no-complex-expressions:** disallow plural/select/selectOrdinal inside t e22d653

### Reverts

* Revert "test: name slow test for cleaner vitest output" bf6eede

## [1.0.1](https://github.com/sebastian-software/eslint-plugin-lingui-typescript/compare/v1.0.0...v1.0.1) (2025-12-02)

Initial stable release.

## 1.0.0 (2025-12-02)

Initial release with 8 rules for Lingui TypeScript projects.
