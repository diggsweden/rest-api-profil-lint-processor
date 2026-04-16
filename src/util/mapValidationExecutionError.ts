// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { SpecParseError } from './RapLPSpecParseError.js';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
function hasErrorsArray(value: unknown): value is { errors: unknown[] } {
  return isObject(value) && Array.isArray(value.errors);
}
function getErrorName(value: unknown): string {
  if (value instanceof Error) {
    return value.name;
  }

  if (isObject(value) && typeof value.name === 'string') {
    return value.name;
  }

  return 'UnknownError';
}
function getErrorMessage(value: unknown): string {
  if (value instanceof Error) {
    return value.message;
  }

  if (isObject(value) && typeof value.message === 'string') {
    return value.message;
  }

  try {
    return String(value);
  } catch {
    return '[unprintable error]';
  }
}
function getErrorStack(value: unknown): string {
  if (value instanceof Error && typeof value.stack === 'string') {
    return value.stack;
  }

  if (isObject(value) && typeof value.stack === 'string') {
    return value.stack;
  }

  return '';
}
function flattenErrors(error: unknown, seen = new Set<unknown>()): unknown[] {
  if (seen.has(error)) {
    return [];
  }

  seen.add(error);

  const result: unknown[] = [error];

  if (hasErrorsArray(error)) {
    for (const child of error.errors) {
      result.push(...flattenErrors(child, seen));
    }
  }

  if (isObject(error) && 'cause' in error) {
    result.push(...flattenErrors(error.cause, seen));
  }

  return result;
}
function buildCombinedErrorText(error: unknown): string {
  return flattenErrors(error)
    .map((item) => {
      const name = getErrorName(item);
      const message = getErrorMessage(item);
      const stack = getErrorStack(item);
      return `${name}: ${message}\n${stack}`;
    })
    .join('\n---\n')
    .toLowerCase();
}
function isAggregateLike(error: unknown): boolean {
  return hasErrorsArray(error);
}
function isKnownRuleEngineInvalidStructureCase(
  error: unknown,
  strictEnabled: boolean
): boolean {
  if (strictEnabled) {
    return false;
  }

  if (!isAggregateLike(error)) {
    return false;
  }
  const combined = buildCombinedErrorText(error);

if (process.env.CI) {
  console.log('--- DEBUG RULE ENGINE DETECTION ---');
  console.log('combined:\n', combined);

  console.log('signals:', {
    nimma: combined.includes('nimma'),
    spectral: combined.includes('@stoplight/spectral'),
    proxyCallbacks: combined.includes('proxy-callbacks.js'),
    scope: combined.includes('scope.js'),
    runner: combined.includes('runner.js'),
    spectralJs: combined.includes('spectral.js'),
    infoThrew: combined.includes('$.info threw'),
    pathsThrew: combined.includes('$.paths threw'),
    errorWithCause: combined.includes('errorwithcause'),
    aggregateError: combined.includes('aggregateerror'),
    threwException: combined.includes('threw an exception'),
    threw: combined.includes(' threw: '),
  });
}

  const fromRuleEngine =
    combined.includes('nimma') ||
    combined.includes('@stoplight/spectral') ||
    combined.includes('proxy-callbacks.js') ||
    combined.includes('scope.js') ||
    //combined.includes('runner.js') ||
    combined.includes('spectral.js') ||
    combined.includes('$.info threw') ||
    combined.includes('$.paths threw') ||
    combined.includes('errorwithcause');


    const ruleExecutionCrash =
    combined.includes('threw an exception') ||
    combined.includes(' threw: ') ||
    combined.includes('errorwithcause');
    //combined.includes('aggregateerror');

  return fromRuleEngine && ruleExecutionCrash;
}
export function mapValidationExecutionError(
  error: unknown,
  opts: { strictEnabled: boolean }
): unknown {
  if (error instanceof SpecParseError) {
    return error;
  }
  if (isKnownRuleEngineInvalidStructureCase(error, opts.strictEnabled)) {
    return SpecParseError.fromRuleEngineInvalidStructure(error);
  }
  return error;
}