// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import i18next from 'i18next';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { cliLocale, getRawOptionValue } from '../../src/cliLocale.js';
import { localeFromAcceptLanguage, resolveLocale, translator } from '../../src/i18n.js';

describe('i18n', () => {
  it('resolves supported locales and falls back to Swedish', () => {
    expect(resolveLocale('en-US')).toBe('en');
    expect(resolveLocale('sv-SE')).toBe('sv');
    expect(resolveLocale('de-DE')).toBe('sv');
    expect(resolveLocale()).toBe('sv');
  });

  it('uses the first Accept-Language preference', () => {
    expect(localeFromAcceptLanguage('en-US,en;q=0.9')).toBe('en');
    expect(localeFromAcceptLanguage('de-DE,en;q=0.9')).toBe('en');
    expect(localeFromAcceptLanguage('sv;q=0.4,en;q=0.9')).toBe('en');
    expect(localeFromAcceptLanguage('sv;q=0.9,en;q=0.4')).toBe('sv');
    expect(localeFromAcceptLanguage('en;q=0')).toBe('sv');
  });

  it('falls back to Swedish when an English key is missing', () => {
    i18next.addResource('sv', 'translation', 'test.swedishFallback', 'Svensk fallback');
    expect(translator('en')('test.swedishFallback')).toBe('Svensk fallback');
  });

  it('returns missing keys unchanged', () => {
    expect(translator('en')('api.unknownError')).toBe('An unknown error occurred.');
    expect(translator('en')('missing.key')).toBe('missing.key');
    expect(translator('en')('api.ruleValidationDetail')).toBe(
      'API-specifikationen bryter mot en eller flera regler enligt den svenska REST API-profilen.',
    );
  });

  it('resolves CLI flag and environment precedence through the option path', () => {
    expect(getRawOptionValue(['--lang', 'en'], 'lang')).toBe('en');
    expect(cliLocale([], { RAP_LP_LANG: 'en' })).toBe('en');
    expect(cliLocale(['--lang', 'sv'], { RAP_LP_LANG: 'en' })).toBe('sv');
  });

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

  it('localizes real API validation errors and sends Vary', () => {
    const apiMode = pathToFileURL(path.resolve('dist/api-mode.js')).href;
    const script = `
      import { startServer } from ${JSON.stringify(apiMode)};
      const server = await startServer({});
      const port = server.address().port;
      const call = async (language) => {
        const headers = {'Content-Type': 'application/json'};
        if (language) headers['Accept-Language'] = language;
        const response = await fetch('http://127.0.0.1:' + port + '/api/v1/validation/validatespec', {
          method: 'POST', headers, body: '{}'
        });
        return {body: await response.json(), vary: response.headers.get('vary')};
      };
      console.log(JSON.stringify({en: await call('en'), unsupported: await call('de'), missing: await call(undefined)}));
      server.close();
    `;
    const output = execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
      encoding: 'utf8',
      env: { ...process.env, RAP_LP_PORT: '0' },
    });
    const lines = output.trim().split(/\r?\n/);
    const result = JSON.parse(lines[lines.length - 1]);
    expect(result.en.body).toMatchObject({ title: 'Invalid request', detail: 'Required field missing: spec' });
    expect(result.unsupported.body).toMatchObject({ title: 'Ogiltig begäran', detail: 'Obligatoriskt fält saknas: spec' });
    expect(result.missing.body).toMatchObject({ title: 'Ogiltig begäran', detail: 'Obligatoriskt fält saknas: spec' });
    expect(result.en.vary).toContain('Accept-Language');
  });

});
