// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { Issue } from './Issue.js';

type Segment = string | number;
type Kind =
  | 'openapi' | 'components' | 'pathItem' | 'operation' | 'parameter' | 'requestBody' | 'response'
  | 'header' | 'mediaType' | 'encoding' | 'callback' | 'schema' | 'example' | 'link';
type Shape = 'one' | 'any' | 'list' | 'map';
type Child = readonly [key: string, kind: Kind, shape: Shape];

/** Which components section a $ref must point to, per kind of object. Kinds not listed are not checked. */
const EXPECTED_SECTION: Partial<Record<Kind, string>> = {
  schema: 'schemas',
  parameter: 'parameters',
  requestBody: 'requestBodies',
  response: 'responses',
  header: 'headers',
  example: 'examples',
  link: 'links',
  callback: 'callbacks',
  mediaType: 'mediaTypes',
};
const KNOWN_SECTIONS = new Set<string>([
  ...(Object.values(EXPECTED_SECTION) as string[]),
  'securitySchemes',
  'pathItems',
]);

const METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace', 'query'];

const CHILDREN: Record<Kind, readonly Child[]> = {
  openapi: [['paths', 'pathItem', 'map'], ['webhooks', 'pathItem', 'map'], ['components', 'components', 'one']],
  components: [
    ['schemas', 'schema', 'map'],
    ['responses', 'response', 'map'],
    ['parameters', 'parameter', 'map'],
    ['examples', 'example', 'map'],
    ['requestBodies', 'requestBody', 'map'],
    ['headers', 'header', 'map'],
    ['links', 'link', 'map'],
    ['callbacks', 'callback', 'map'],
    ['pathItems', 'pathItem', 'map'],
    ['mediaTypes', 'mediaType', 'map'],
  ],
  pathItem: [
    ['parameters', 'parameter', 'list'],
    ...METHODS.map((m): Child => [m, 'operation', 'one']),
    ['additionalOperations', 'operation', 'map'],
  ],
  operation: [
    ['parameters', 'parameter', 'list'],
    ['requestBody', 'requestBody', 'one'],
    ['responses', 'response', 'map'],
    ['callbacks', 'callback', 'map'],
  ],
  parameter: [['schema', 'schema', 'one'], ['content', 'mediaType', 'map'], ['examples', 'example', 'map']],
  requestBody: [['content', 'mediaType', 'map']],
  response: [['headers', 'header', 'map'], ['content', 'mediaType', 'map'], ['links', 'link', 'map']],
  header: [['schema', 'schema', 'one'], ['content', 'mediaType', 'map'], ['examples', 'example', 'map']],
  mediaType: [
    ['schema', 'schema', 'one'],
    ['itemSchema', 'schema', 'one'],
    ['examples', 'example', 'map'],
    ['encoding', 'encoding', 'map'],
  ],
  encoding: [['headers', 'header', 'map']],
  callback: [], // handled separately in visit(): every key is a path item
  example: [],
  link: [],
  schema: [
    ...['additionalProperties', 'not', 'if', 'then', 'else', 'contains', 'propertyNames', 'contentSchema',
      'unevaluatedItems', 'unevaluatedProperties'].map((k): Child => [k, 'schema', 'one']),
    ['items', 'schema', 'any'],
    ...['allOf', 'anyOf', 'oneOf', 'prefixItems'].map((k): Child => [k, 'schema', 'list']),
    ...['properties', 'patternProperties', '$defs', 'definitions', 'dependentSchemas'].map(
      (k): Child => [k, 'schema', 'map'],
    ),
  ],
};

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Finds internal $refs that point to the wrong kind of component, for example a parameter
 * that points to components/schemas. Existence of the target is not checked here (Spectral
 * reports that as invalid-ref). Only the known OpenAPI structure is traversed, so values
 * of example/default/enum are never inspected.
 *
 * @param data  parsed (unresolved) document
 * @param lineOf  optional: 1-based line for a JSON path
 */
export function findRefTargetMismatches(
  data: unknown,
  lineOf: (path: Segment[]) => number | null = () => null,
): Issue[] {
  const issues: Issue[] = [];

  const check = (ref: string, kind: Kind, path: Segment[]) => {
    const expected = EXPECTED_SECTION[kind];
    if (!expected) return;
    const m = /^#\/components\/([^/]+)\//.exec(ref);
    if (!m) return; // not a components reference: cannot judge
    const actual = m[1];
    if (!KNOWN_SECTIONS.has(actual) || actual === expected) return;
    const refPath = [...path, '$ref'];
    const joined = refPath.join('.');
    issues.push({
      type: 'Structural',
      code: 'ref-target-type',
      path: joined,
      message: `"$ref" must point to components/${expected}, but points to components/${actual}.`,
      line: lineOf(refPath),
      location: joined,
    });
  };

  const visit = (node: unknown, kind: Kind, path: Segment[]): void => {
    if (!isObj(node)) return;
    if (typeof node.$ref === 'string') {
      check(node.$ref, kind, path);
      return;
    }
    if (kind === 'callback') {
      for (const [k, v] of Object.entries(node)) {
        if (!k.startsWith('x-')) visit(v, 'pathItem', [...path, k]);
      }
      return;
    }
    for (const [key, childKind, shape] of CHILDREN[kind]) {
      const child = node[key];
      if (child === undefined) continue;
      const p = [...path, key];
      if (shape === 'one') {
        visit(child, childKind, p);
      } else if (shape === 'any') {
        if (Array.isArray(child)) child.forEach((c, i) => visit(c, childKind, [...p, i]));
        else visit(child, childKind, p);
      } else if (shape === 'list') {
        if (Array.isArray(child)) child.forEach((c, i) => visit(c, childKind, [...p, i]));
      } else if (isObj(child)) {
        for (const [k, v] of Object.entries(child)) {
          // extension keys (x-...) are skipped, except in schema maps where they are real property names
          if (childKind !== 'schema' && k.startsWith('x-')) continue;
          visit(v, childKind, [...p, k]);
        }
      }
    }
  };

  visit(data, 'openapi', []);
  return issues;
}