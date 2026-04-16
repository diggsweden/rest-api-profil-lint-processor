// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2
import { mapValidationExecutionError } from '../../src/util/mapValidationExecutionError';
import { SpecParseError } from '../../src/util/RapLPSpecParseError';
import { AggregateError } from '../../src/util/RapLPCustomErrorInfo.js'

declare var AggregateError: {
  prototype: AggregateError;
  new (errors: any[], message?: string): AggregateError;
};

/**
 * SpecParseError unchanged 
 * Preconditions: stage -> sanity
 * strictEnaled: false
 */
describe('mapValidationExecutionError', () => {
  it('returns existing SpecParseError unchanged for YAML parse case', () => {
    const original = new SpecParseError('Ogiltig YAML-syntax.', {
      source: 'yaml',
      stage: 'sanity',
      line: 3,
      column: 7,
    });

    const mapped = mapValidationExecutionError(original, {
      strictEnabled: false,
    });

    expect(mapped).toBe(original);
    expect(mapped).toBeInstanceOf(SpecParseError);
  });

/**
 * SpecParseError unchanged 
 * Preconditions: stage -> sanity
 * strictValidation: enabled
 */
  it('returns existing SpecParseError unchanged for strict validation case', () => {
    const original = new SpecParseError(
      'Strict validation failed: must have required property "paths"',
      {
        source: 'unknown',
        stage: 'strict',
      }
    );

    const mapped = mapValidationExecutionError(original, {
      strictEnabled: true,
    });

    expect(mapped).toBe(original);
    expect(mapped).toBeInstanceOf(SpecParseError);
  });

/**
 * SpecParseError AggregateError transformed to a SpecParseError due to rule engine crash 
 * Preconditions: Strictvalidation -> disabled
 * 
 */
  it('maps known rule-engine AggregateError to SpecParseError when strict validation is disabled', () => {
    const inner = new Error(
      '$.info threw: ErrorWithCause("Function \\"function\\" threw an exception: Cannot read properties of null (reading \'description\')")'
    );

    inner.stack = `
Error: $.info threw: ErrorWithCause("Function \\"function\\" threw an exception: Cannot read properties of null (reading 'description')")
    at _callbacks.<computed> (/project/node_modules/nimma/dist/legacy/cjs/runtime/proxy-callbacks.js:34:21)
    at Runner.run (/project/node_modules/@stoplight/spectral-core/dist/runner/runner.js:51:13)
    at Spectral.run (/project/node_modules/@stoplight/spectral-core/dist/spectral.js:63:17)
`;

    const aggregate = new AggregateError([inner], 'Rule engine crashed');

    const mapped = mapValidationExecutionError(aggregate, {
      strictEnabled: false,
    });

    expect(mapped).toBeInstanceOf(SpecParseError);

    const specError = mapped as SpecParseError;
    expect(specError.message).toContain(
      'Specifikationen verkar sakna eller innehålla ogiltiga OpenAPI-fält'
    );
    expect(specError.stage).toBe('rule-engine');
    expect(specError.cause).toBe(aggregate);
  });
/**
 * SpecParseError AggregateError NOT transformed to a SpecParseError  
 * Preconditions: Strictvalidation -> enabled
 * 
 */
  it('does not map AggregateError to SpecParseError when strict validation is enabled', () => {
    const inner = new Error(
      'Cannot read properties of null (reading \'description\')'
    );

    inner.stack = `
Error: Cannot read properties of null (reading 'description')
    at _callbacks.<computed> (/project/node_modules/nimma/dist/legacy/cjs/runtime/proxy-callbacks.js:34:21)
    at Spectral.run (/project/node_modules/@stoplight/spectral-core/dist/spectral.js:63:17)
`;

    const aggregate = new AggregateError([inner], 'Rule engine crashed');

    const mapped = mapValidationExecutionError(aggregate, {
      strictEnabled: true,
    });

    expect(mapped).toBe(aggregate);
    expect(mapped).not.toBeInstanceOf(SpecParseError);
  });

/**
 * SpecParseError AggregateError NOT transformed to a SpecParseError when unrelated
 * Preconditions: Strictvalidation -> disabled
 * 
 */
  it('does not map unrelated AggregateError', () => {
    const inner = new Error('Database connection failed');
    inner.stack = `
Error: Database connection failed
    at connectDb (/project/src/db.ts:10:1)
`;

    const aggregate = new AggregateError([inner], 'Unexpected internal error');

    const mapped = mapValidationExecutionError(aggregate, {
      strictEnabled: false,
    });

    expect(mapped).toBe(aggregate);
    expect(mapped).not.toBeInstanceOf(SpecParseError);
  });
});