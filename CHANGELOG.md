# Changelog

All notable changes to this project will be documented in this file.

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
