// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { Issue, sortIssues,consolidateIssues } from '../../src/util/RapLPIssueHelpers.js';
import { spectralDiagnosticsToIssuesSimple } from '../../src/util/RapLPIssueHelpers.js';
import type * as SpectralCore from '@stoplight/spectral-core';
describe('IssueHelper.sortIssues', ()=> {
    it('Sorterar issues efter line, path och typ', () => {
        const issues: Issue[] = [
        {
            type: 'Structural',
            path: 'components.schemas.B',
            message: 'Missing $ref',
            line: 50,
            raw: [],
        },
        {
            type: 'Semantic',
            path: 'components.schemas.A',
            message: 'Required property must not be empty',
            line: 20,
            code: 'oas3-schema',
            raw: [],
        },
        {
            type: 'Structural',
            path: 'components.schemas.A',
            message: 'Should have required property',
            line: 20,
            raw: [],
        },
        {
            type: 'Semantic',
            path: 'components.schemas.C',
            message: 'Extra property not allowed',
            line: 50,
            code: 'oas3-schema',
            raw: [],
        },
        {
            type: 'Info',
            path: 'components.schemas.D',
            message: 'Some info message',
            line: undefined,
            raw: [],
        },
        ];
        expect (issues.map(i =>i.path)).toEqual ([
            'components.schemas.B',
            'components.schemas.A',
            'components.schemas.A',
            'components.schemas.C',
            'components.schemas.D',
        ]);
        const sorted = sortIssues(issues);

        const expectedOrder = [
            'components.schemas.A', // Semantic
            'components.schemas.A', // Structural
            'components.schemas.B', // Structural
            'components.schemas.C', // Semantic
            'components.schemas.D', // Info, line undefined            
        ];
            expect(sorted.map(i => i.path)).toEqual(expectedOrder);
            expect(sorted[0].type).toBe('Semantic');
            expect(sorted[1].type).toBe('Structural');
            expect(sorted[4].line).toBeUndefined();        
    });

});
describe('spectralDiagnosticsToIssuesSimple', () => {
  it('konverterar ISpectralDiagnostic till Issue med fallbackAddOne=false', () => {
    const diag: Partial<SpectralCore.ISpectralDiagnostic> = {
      code: 'path-params',
      message: 'Operation must define parameter "{id}"',
      path: ['paths', '/petshamta/{id}', 'get'],
      range: { start: { line: 196, character: 0 }, end: { line: 200, character: 0 } },
      source: '/tmp/api.yaml',
    } as any;

    // no prettyLines -> fallback false -> line should equal rawLine (196)
    const issues = spectralDiagnosticsToIssuesSimple([diag as any], undefined, false);
    expect(issues.length).toBe(1);
    expect(issues[0].line).toBe(196);
    expect(issues[0].path).toBe('paths./petshamta/{id}.get');
  });

  it('använder prettyLines för att bestämma +1 (om jump innehåller rawLine+1)', () => {
    const diag: Partial<SpectralCore.ISpectralDiagnostic> = {
      code: 'X',
      message: 'm',
      path: ['paths', '/x', 'get'],
      range: { start: { line: 5, character: 0 }, end: { line: 5, character: 1 } },
    } as any;

    const pretty = ['Structural error at paths./x', 'should something', 'Jump to line 6'];
    const issues = spectralDiagnosticsToIssuesSimple([diag as any], pretty, false);
    expect(issues[0].line).toBe(6);
  });
});
describe('consolidateIssues', () => {
  it('prioriterar semantic över structural och samlar details', () => {
    const items: Issue[] = [
      { type: 'Structural', path: 'c.s', message: 'x', line: 10 },
      { type: 'Semantic', path: 'c.s', message: 'y', line: 10 }
    ];
    const out = consolidateIssues(items);
    expect(out.length).toBe(1);
    expect(out[0].type).toBe('Semantic');
    // details should contain structural message
    expect(out[0].details && out[0].details.some(d => d === 'x')).toBe(true);
  });

  it('tar bort oneOf när mer specifika finns', () => {
    const items: Issue[] = [
      { type: 'Structural', path: 'parent.child', message: 'oneOf schema', line: 1 },
      { type: 'Structural', path: 'parent.child.specific', message: 'specific error', line: 1 }
    ];
    const out = consolidateIssues(items);
    expect(out.some(i => /oneOf/i.test(i.message))).toBe(false);
    expect(out.some(i => /specific error/i.test(i.message))).toBe(true);
  });
});