// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

describe('CLI locale integration', () => {
      it('uses the selected locale through the real CLI entrypoint', () => {
      const distApp = path.resolve('dist/app.js');
      const environment = { ...process.env, RAP_LP_LANG: 'sv' };

      const flagOutput = execFileSync(process.execPath, [distApp, '--lang', 'en', '--help'], {
        encoding: 'utf8',
        env: environment,
      });

      const envOutput = execFileSync(process.execPath, [distApp, '--help'], {
        encoding: 'utf8',
        env: { ...process.env, RAP_LP_LANG: 'en' },
      });

      expect(flagOutput).toContain('Application mode');
      expect(envOutput).toContain('Application mode');
    });

    it('loads catalogues from the built package root when cwd has no locales', () => {
      const cwd = mkdtempSync(path.join(tmpdir(), 'raplp-i18n-'));

      try {
        const output = execFileSync(process.execPath, [path.resolve('dist/app.js'), '--lang', 'en', '--help'], {
          cwd,
          encoding: 'utf8',
        });

        expect(output).toContain('Application mode');
      } finally {
        rmSync(cwd, { recursive: true, force: true });
      }
    });

    it('localizes validation results through the real CLI entrypoint', () => {
      const distApp = path.resolve('dist/app.js');
      const apiSpec = path.resolve('tests/testdata/dok-api.yaml');

      const output = execFileSync(process.execPath, [distApp, '--lang', 'en', '-f', apiSpec], {
        encoding: 'utf8',
      });

      expect(output).toContain('area: Dokumentation');
      expect(output).not.toContain('område: Dokumentation');
    });

    it('uses Swedish validation results by default', () => {
      const distApp = path.resolve('dist/app.js');
      const apiSpec = path.resolve('tests/testdata/dok-api.yaml');

      const output = execFileSync(process.execPath, [distApp, '-f', apiSpec], {
        encoding: 'utf8',
      });

      expect(output).toContain('område: Dokumentation');
      expect(output).not.toContain('area: Dokumentation');
    });
});