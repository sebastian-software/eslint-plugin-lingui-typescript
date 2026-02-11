# Changelog

All notable changes to this project will be documented in this file.

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
