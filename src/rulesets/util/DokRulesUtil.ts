// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

import * as chrono from 'chrono-node';

export const translateToEnglish = (text: string): string => {
  return text
    .replace(/\bjan(uari)?\b/gi, 'January')
    .replace(/\bfeb(ruari)?\b/gi, 'February')
    .replace(/\bmar(s)?\b/gi, 'March')
    .replace(/\bapr(il)?\b/gi, 'April')
    .replace(/\bmaj\b/gi, 'May')
    .replace(/\bjun(i)?\b/gi, 'June')
    .replace(/\bjul(i)?\b/gi, 'July')
    .replace(/\baug(usti)?\b/gi, 'August')
    .replace(/\bsep(tember)?\b/gi, 'September')
    .replace(/\bokt(ober)?\b/gi, 'October')
    .replace(/\bnov(ember)?\b/gi, 'November')
    .replace(/\bdec(ember)?\b/gi, 'December')
    .replace(/\bidag\b/gi, 'today')
    .replace(/\bimorgon\b/gi, 'tomorrow')
    .replace(/\b(igår|i går)\b/gi, 'yesterday')
    .replace(/\bnästa\b/gi, 'next');
};

export const containsDate = (input: string): boolean => {
  if (typeof input !== 'string') {
    return false;
  }
  const translatedInput = translateToEnglish(input);
  const results = chrono.parseDate(translatedInput);
  if (results != null) {
    return true;
  } else {
    return false;
  }
};
