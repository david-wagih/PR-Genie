import { ReviewConfig, LanguageConfig, FilePattern } from '../types';
import { DEFAULT_REVIEW_CONFIG, DEFAULT_LANGUAGE_CONFIG } from '../config/config';
import { minimatch } from 'minimatch';

export class ConfigService {
  private config: ReviewConfig;

  constructor(config?: Partial<ReviewConfig>) {
    this.config = this.mergeConfig(config || {});
  }

  private mergeConfig(customConfig: Partial<ReviewConfig>): ReviewConfig {
    return {
      languages: {
        ...DEFAULT_REVIEW_CONFIG.languages,
        ...customConfig.languages,
      },
      globalIgnorePatterns: [
        ...DEFAULT_REVIEW_CONFIG.globalIgnorePatterns,
        ...(customConfig.globalIgnorePatterns || []),
      ],
      defaultMaxFileSize:
        customConfig.defaultMaxFileSize || DEFAULT_REVIEW_CONFIG.defaultMaxFileSize,
      defaultPrompt: customConfig.defaultPrompt || DEFAULT_REVIEW_CONFIG.defaultPrompt,
      defaultChecks: [
        ...DEFAULT_REVIEW_CONFIG.defaultChecks,
        ...(customConfig.defaultChecks || []),
      ],
    };
  }

  getLanguageConfig(language: string): LanguageConfig {
    return (
      this.config.languages[language] || {
        ...DEFAULT_LANGUAGE_CONFIG,
        fileExtensions: [],
        ignorePatterns: [],
      }
    );
  }

  shouldIgnoreFile(filepath: string): boolean {
    // Check global ignore patterns
    for (const pattern of this.config.globalIgnorePatterns) {
      if (minimatch(filepath, pattern.pattern)) {
        return true;
      }
    }

    // Check language-specific ignore patterns
    const language = this.detectLanguage(filepath);
    if (language) {
      const languageConfig = this.getLanguageConfig(language);
      for (const pattern of languageConfig.ignorePatterns) {
        if (minimatch(filepath, pattern.pattern)) {
          return true;
        }
      }
    }

    return false;
  }

  detectLanguage(filepath: string): string | null {
    const extension = filepath.split('.').pop()?.toLowerCase();
    if (!extension) return null;

    for (const [language, langConfig] of Object.entries(this.config.languages)) {
      if (langConfig.fileExtensions.includes(extension)) {
        return language;
      }
    }

    return null;
  }

  getMaxFileSize(filepath: string): number {
    const language = this.detectLanguage(filepath);
    if (language) {
      return this.getLanguageConfig(language).maxFileSize;
    }
    return this.config.defaultMaxFileSize;
  }

  getReviewPrompt(language: string, code: string): string {
    const languageConfig = this.getLanguageConfig(language);
    const customPrompt = languageConfig.customPrompt || this.config.defaultPrompt;

    const additionalChecks = [
      ...this.config.defaultChecks,
      ...(languageConfig.additionalChecks || []),
    ]
      .map(check => `- ${check}`)
      .join('\n');

    return customPrompt
      .replace('{language}', language)
      .replace('{code}', code)
      .replace('{additionalChecks}', additionalChecks);
  }

  getFilePatterns(): FilePattern[] {
    return [
      ...this.config.globalIgnorePatterns,
      ...Object.values(this.config.languages).flatMap(config => config.ignorePatterns),
    ];
  }
}
