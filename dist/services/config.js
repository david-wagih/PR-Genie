"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = void 0;
const config_1 = require("../config/config");
const minimatch_1 = require("minimatch");
class ConfigService {
    config;
    constructor(config) {
        this.config = this.mergeConfig(config || {});
    }
    mergeConfig(customConfig) {
        return {
            languages: {
                ...config_1.DEFAULT_REVIEW_CONFIG.languages,
                ...customConfig.languages
            },
            globalIgnorePatterns: [
                ...config_1.DEFAULT_REVIEW_CONFIG.globalIgnorePatterns,
                ...(customConfig.globalIgnorePatterns || [])
            ],
            defaultMaxFileSize: customConfig.defaultMaxFileSize || config_1.DEFAULT_REVIEW_CONFIG.defaultMaxFileSize,
            defaultPrompt: customConfig.defaultPrompt || config_1.DEFAULT_REVIEW_CONFIG.defaultPrompt,
            defaultChecks: [
                ...config_1.DEFAULT_REVIEW_CONFIG.defaultChecks,
                ...(customConfig.defaultChecks || [])
            ]
        };
    }
    getLanguageConfig(language) {
        return this.config.languages[language] || {
            ...config_1.DEFAULT_LANGUAGE_CONFIG,
            fileExtensions: [],
            ignorePatterns: []
        };
    }
    shouldIgnoreFile(filepath) {
        // Check global ignore patterns
        for (const pattern of this.config.globalIgnorePatterns) {
            if ((0, minimatch_1.minimatch)(filepath, pattern.pattern)) {
                return true;
            }
        }
        // Check language-specific ignore patterns
        const language = this.detectLanguage(filepath);
        if (language) {
            const languageConfig = this.getLanguageConfig(language);
            for (const pattern of languageConfig.ignorePatterns) {
                if ((0, minimatch_1.minimatch)(filepath, pattern.pattern)) {
                    return true;
                }
            }
        }
        return false;
    }
    detectLanguage(filepath) {
        const extension = filepath.split('.').pop()?.toLowerCase();
        if (!extension)
            return null;
        for (const [language, langConfig] of Object.entries(this.config.languages)) {
            if (langConfig.fileExtensions.includes(extension)) {
                return language;
            }
        }
        return null;
    }
    getMaxFileSize(filepath) {
        const language = this.detectLanguage(filepath);
        if (language) {
            return this.getLanguageConfig(language).maxFileSize;
        }
        return this.config.defaultMaxFileSize;
    }
    getReviewPrompt(language, code) {
        const languageConfig = this.getLanguageConfig(language);
        const customPrompt = languageConfig.customPrompt || this.config.defaultPrompt;
        const additionalChecks = [
            ...this.config.defaultChecks,
            ...(languageConfig.additionalChecks || [])
        ].map(check => `- ${check}`).join('\n');
        return customPrompt
            .replace('{language}', language)
            .replace('{code}', code)
            .replace('{additionalChecks}', additionalChecks);
    }
    getFilePatterns() {
        return [
            ...this.config.globalIgnorePatterns,
            ...Object.values(this.config.languages).flatMap(config => config.ignorePatterns)
        ];
    }
}
exports.ConfigService = ConfigService;
