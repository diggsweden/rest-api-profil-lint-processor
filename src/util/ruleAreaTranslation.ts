// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

import { translator, type Locale } from '../i18n.js';

const areaKeyMap: Record<string, string> = {
  'URL Format och namngivning': 'areas.urlFormatAndNaming',
  Säkerhet: 'areas.security',
  'Spårbarhet och korrelation': 'areas.traceabilityAndCorrelation',
  Versionhantering: 'areas.versioning',
  'Filtrering, paginering och sökparametrar': 'areas.filteringPaginationSearch',
  'API Request': 'areas.apiRequest',
  Dokumentation: 'areas.documentation',
  'API Message': 'areas.apiMessage',
  Förutsättningar: 'areas.prerequisites',
  'Datum- och tidsformat': 'areas.dateTimeFormat',
  Resurser: 'areas.resources',
  Mognad: 'areas.maturity',
  Felhantering: 'areas.errorHandling',
};

export function translateRuleArea(area: string, locale: Locale): string {
  const key = areaKeyMap[area];

  return key ? translator(locale)(key) : area;
}