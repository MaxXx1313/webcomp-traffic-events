// SPDX-FileCopyrightText: 2025 NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * @param {object} obj object with multilanguage data
 * @param {string} languageCode desired language
 */
export function translateProperty<T>(obj: { [languageCode: string]: T }, languageCode: string) {
  if (!obj) {
    return null;
  }
  let proposal = obj[languageCode];
  if (!proposal) {
    // try to use default language
    proposal = obj['it'];

    if (!proposal) {
      console.warn('Cannot find fallback language', obj);
      // try to use first available language
      const langPresent = Object.keys(obj);
      proposal = obj[langPresent[0]];
    }
  }
  return proposal as T;
}

/**
 * @param {object} obj object with multilanguage data
 * @param {string} prop object property
 * @param {string} languageCode desired language
 */
export function translatePropertyInner<T, P extends keyof T>(obj: {
  [languageCode: string]: T
}, prop: P, languageCode: string): T[P] {
  if (!obj) {
    return null;
  }
  let proposal = obj[languageCode]?.[prop];
  if (!proposal) {
    // console.warn('Cannot find language', languageCode);
    // try to use default language
    proposal = obj['it']?.[prop];

    if (!proposal) {
      console.warn('Cannot find fallback language', obj);
      // try to use first available language
      const langPresent = Object.keys(obj);
      for (const lang of langPresent) {
        proposal = obj[lang]?.[prop];
        if (proposal) {
          return proposal;
        }
      }
    }
  }
  return proposal;
}

/**
 *
 */
export function detectBrowserLanguage(): string {
  return navigator.language ? navigator.language.split('-')[0] : null;
}


/**
 *
 */
export function detectAllowedBrowserLanguage(langsAllowed: string[], langFallback: string): string {
  const browserLanguage = detectBrowserLanguage();
  if (langsAllowed.includes(browserLanguage)) {
    return browserLanguage;
  }
  return langFallback;
}
