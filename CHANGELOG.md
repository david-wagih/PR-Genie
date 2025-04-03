# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0](https://github.com/david-wagih/PR-Genie/compare/v1.1.5...v1.2.0) (2025-04-03)


### Features

* enhance OpenAI service and add retry logging; update README with usage example ([b872b99](https://github.com/david-wagih/PR-Genie/commit/b872b99ccd1d93fd7e45c140cc9c23ebdff162ce))
* integrate @vercel/ncc for build optimization and update package scripts ([c138df6](https://github.com/david-wagih/PR-Genie/commit/c138df68b36884b50e7d5b1aaea7c600c108aab7))

## [1.1.5](https://github.com/david-wagih/PR-Genie/compare/v1.1.4...v1.1.5) (2025-03-30)


### Bug Fixes

* update the readme file ([ed8bfc3](https://github.com/david-wagih/PR-Genie/commit/ed8bfc376be12d7d25ac9403eb02fda0970bbb46))

## [1.1.4](https://github.com/david-wagih/PR-Genie/compare/v1.1.3...v1.1.4) (2025-03-30)


### Bug Fixes

* fix issues in release CI ([a1e90fb](https://github.com/david-wagih/PR-Genie/commit/a1e90fb7c471f226d923ec8cc1d967fea88e5079))

## [1.1.2](https://github.com/david-wagih/PR-Genie/compare/v1.1.1...v1.1.2) (2025-03-30)


### Bug Fixes

* fix the action description and icon ([f3c4298](https://github.com/david-wagih/PR-Genie/commit/f3c4298985d4df40b36270c392d3f0d4424d1eae))

## [1.1.1](https://github.com/david-wagih/PR-Genie/compare/v1.1.0...v1.1.1) (2025-03-30)


### Bug Fixes

* fix the release workflow ([85bc877](https://github.com/david-wagih/PR-Genie/commit/85bc877dd4f6083453d2bcf144b1c4d74a89d860))

## [1.1.0](https://github.com/david-wagih/PR-Genie/compare/v1.0.0...v1.1.0) (2025-03-30)


### Features

* add pull request number input to action.yml and update workflow to utilize it ([2ca8f3a](https://github.com/david-wagih/PR-Genie/commit/2ca8f3a6c942725f224ffeda1ddc3198426266cc))
* enhance pull request summary generation with detailed analysis and next steps ([66555df](https://github.com/david-wagih/PR-Genie/commit/66555df1075d3de6ece7e520eff9248df6792bd6))
* expand review feedback structure to include detailed analysis of estimated effort, relevant tests, possible issues, security concerns, and code quality improvements ([dae9900](https://github.com/david-wagih/PR-Genie/commit/dae99000d2398181bf93847e520debb1a511f6bc))
* improve pull request summary with detailed sections for review effort, relevant tests, possible issues, and security concerns ([9be107f](https://github.com/david-wagih/PR-Genie/commit/9be107fe551f46d6c7c3486b370aa632c95a963a))
* integrate AI-powered code review functionality ([7b543ac](https://github.com/david-wagih/PR-Genie/commit/7b543ac6e85528f0c0e21575c5c769b688891f9f))


### Bug Fixes

* update release workflow to enhance GitHub release process ([a11696b](https://github.com/david-wagih/PR-Genie/commit/a11696b17b3bcb67cc7d32f55bcd742eea369cd3))
* validate pull request number in PR Genie action and remove GitHub token input ([8a0735b](https://github.com/david-wagih/PR-Genie/commit/8a0735b5b5b54ef21b6455787b15041e3b7b0cdf))

## [Unreleased]

### Added
- Initial release of PR Genie
- AI-powered code review capabilities
- Support for multiple programming languages
- Customizable review configurations
- Security and performance analysis
- Test coverage checking
- Automatic version bumping and release creation

### Changed
- Enhanced code review format to match industry standards
- Improved error handling and validation

### Security
- Added code sanitization for security
- Implemented token validation
- Added file size limits
