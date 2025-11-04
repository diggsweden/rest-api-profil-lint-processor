// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { createRequire } from 'module';
import path from 'path';

const require = createRequire(import.meta.url);

import { existsSync } from 'fs';

export const loadUrlValidationConfiguration = (customFilePath?: string) => {
  const configFileToUse = customFilePath ?? path.join(process.cwd(), 'urlValidationConfig.cjs');

  if (!existsSync(configFileToUse)) {
    console.error(
      'Could not find configuration file for urlValidation, consider adding the file or run server without --enableUrlValidation',
    );
    throw Error(`Could not find config file ${configFileToUse}`);
  }

  return require(configFileToUse);
};
