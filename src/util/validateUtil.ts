// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

import yaml from 'js-yaml';
import SwaggerParser from '@apidevtools/swagger-parser'; 
import { prettifySwaggerParserErrorToEditorStyle } from './prettifyOpenAPIErrors.js';
import  { bundleAndLoadRuleset } from '@stoplight/spectral-ruleset-bundler/with-loader';
import * as SpectralCore from '@stoplight/spectral-core';
import { Document as SpectralDocument } from '@stoplight/spectral-core';
import * as fs2 from 'node:fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { RapLPCustomSpectral } from './RapLPCustomSpectral.js'; 
import Parsers from '@stoplight/spectral-parsers';
import type { IParser } from '@stoplight/spectral-parsers';
import * as IssueHelper from './RapLPIssueHelpers.js';
import { SpecParseError, SpecParseErrorSource} from './RapLPSpecParseError.js';
import { Issue } from './Issue.js';

/**
 * 
 */
type ExternalRefFinding = {
  path: string;
  ref: string;
};


/**
 * Possible input types for specifications
 * - filePath: Read from filesystem
 * - raw: raw text (probably YAML or JSON)
 * - base64: base64-coded content
 * - parsed: allready parsed object (skip parsing)
 */
export type SpecInput = 
| {filePath: string}
| {raw:string}
| {base64: string}
| {parsed: any};

/**
 * Return result after successfull parsing
 */
export type ParseResult = {
  format: 'json' | 'yaml';
  raw: string;
  parsed: any;  
  strictIssues?: Issue[];
}
export type ParseOptions = {
  preferJsonError?: 'auto' | 'never' | 'always';
  /**
   * Limit how long the snippet in SpecParseError can be (optional).
   */
  maxSnippetLength?: number;
  disableSanity?: boolean;
  strict?: boolean;
};
export type PreferJsonOption = 'auto' | 'never' | 'always';

/**
 * detectSpecFormatPreference
 * --------------------------------
 * Function to determine how we should be interpret the format of the OpenAPI Specification.
 * Normal case is either JSON,YAML or undefined format
 *          'always' Expect JSON, give JSON-errorMessages
 *          'never'  Expect YAML, give YAML-errorMessages
 *          'auto' ' Try to solve format base on content'
 * Returns: PreferJsnOption 
 */
export function detectSpecFormatPreference(
  filePath?: string | null,
  raw?: string | null,
  defaultOption: PreferJsonOption = 'never',
): PreferJsonOption {
  if (filePath) {
    const ext = (filePath.split('.').pop() || '').toLowerCase();
    if (ext === 'json') return 'always';
    if (ext === 'yaml' || ext === 'yml') return 'never';
  }

  if (raw) {
    const t = raw.trim();
    if (t.startsWith('{') || t.startsWith('[')) return 'always';
    if (/^\s*<\?xml|^\s*<[\w-]+[\s>]/i.test(t)) return 'never';
  }

  return defaultOption;
}
/**
 * 
 * @param input :SpecInput // input type for specifications
 * @param SpecInput,ParseOptions(Optional)
 * @returns Promise<ParseResult>
 * @throws SpecParseError // if the content is not valid JSON or YAML. 
 */
export async function parseApiSpecInput(input: SpecInput,
  opts: ParseOptions = {}
): Promise<ParseResult> {

  const prefer = opts.preferJsonError ?? 'never'; // Standard is YAML focus 
  const maxSnippetLength = opts.maxSnippetLength ?? 5000; 
  const strict = opts.strict ?? false; // Strict flag is normally set to false
  
  if ('parsed' in input) { // Checks if content is alreay parsed
    const parsed = input.parsed;
    if (!isOpenApiLike(parsed)) {
      throw new SpecParseError('Det parsade objektet verkar inte vara en giltig OpenAPI-specifikation.',
         { source: 'unknown', stage: 'sanity' });
    }
    const serialized = JSON.stringify(parsed, null, 2); // Serialize raw format
    let strictIssues: Issue[] | undefined;
    if (strict) { 
      try {
        await runStrictValidationIfRequested(parsed, 'json');
      }catch (err: any) {
        const rawForMap = serialized;
        const pretty = prettifySwaggerParserErrorToEditorStyle(
          err?.message ?? String(err), rawForMap ?? '');
          strictIssues = IssueHelper.parsePrettyLinesToIssues(pretty);
      
      }
    }
    return { format: 'json', raw: serialized, parsed, strictIssues };
  }

  //Step one - Get rawtext from input
  let raw: string;
  try {
    raw = getRawFromInput(input);
  }catch (e: any) {
    throw new SpecParseError(String(e.message || e), {
    source: 'unknown',
    stage: 'sanity',
    });    
  }
  //Step two - Create "stripped" variant (removes SPDX comments, empty lines, block comment at the beginning)
  const stripped = stripLeadingCommentsAndWhitespace(raw).trimStart();

  // Step three - Quick XML detection: If looks like  XML -> reject
   ensureIsNotXmlLike(stripped);
  //Step four - Check if input looks like JSON or YAML 
  const jsonCandidate = looksLikeJson(stripped);
  const yamlCandidate = looksLikeYamlOpenApi(stripped); 

  if (!jsonCandidate && !yamlCandidate) {
    throw new SpecParseError('Innehållet verkar inte vara JSON eller YAML.', { source: 'unknown', stage: 'sanity' });
  }
  // Step five - Decision logic when choosing parser: 
  // - prefer === 'never' => YAML-first (skipped JSON) 
  // - prefer === 'always' => JSON-first (fail-fast) 
  // - prefer === 'auto' => if looksLikeJson => JSON-first (fail-fast) else YAML-first
  const shouldTryJson = (prefer === 'always') || (prefer === 'auto' && jsonCandidate);
  const shouldTryYaml = prefer === 'never' || (prefer === 'auto' && yamlCandidate && !jsonCandidate);


  let lastJsonError: SpecParseError | SyntaxError |undefined;
  let parsedSpec: any;
  let target: any;

  // Step six -  Try parse in choosed order, and return ParseResult or throw SpecParseError
  if (shouldTryJson) {
    try {
      parsedSpec = tryParseJson(raw);
      target = 'json';
    } catch (e: any) {
        if (e instanceof SpecParseError) { // Safecheck, should always be SpecParseError
          lastJsonError = e;
          //Fail fast for JSON
          if (prefer === 'always') throw e;
        }else {
        //If error is unexpected - propagate up
          throw e;
        }
    }
  }else if (!parsedSpec && shouldTryYaml) {
    //Step four - Try to parse input as yaml
    try {
      parsedSpec = tryParseYaml(raw,maxSnippetLength);
      target = 'yaml';
    }catch (yamlErr: any) {
      //Check if error is allready a interpreted error (SpecParseError), throw it further 
      if (yamlErr instanceof SpecParseError) throw yamlErr;
      // Fallback generiskt error - Is there a previous jsonSyntaxErr
      if (lastJsonError) throw lastJsonError; // Tidigare fel 

      throw new SpecParseError('Kunde inte tolka innehållet som JSON eller YAML.', { source: 'unknown', stage: 'sanity'});
    }
  }
  //Make sure parsed specification is OpenAPI like
  ensureIsOpenApiLike(parsedSpec,target);
  //Make sure parsed specification is a secure OpenAPI like
  ensureIsSecureOpenApiLike(parsedSpec,target);
  
  let issues: Issue[] | undefined;
  let prettyLines: string[] = [];
  //If here - we have a parsed openapi object
  if (strict) {
    try {
      //Run structural validation first (async run)
      await runStrictValidationIfRequested(parsedSpec, target);
    }catch (err:any) {
        prettyLines = prettifySwaggerParserErrorToEditorStyle(
          err?.message ?? String(err), raw ?? '');
    }

    let spectralDiagnostics: SpectralCore.ISpectralDiagnostic[] = [];
    try {
      // Build a Spectral Document from raw and the right parser so Spectral gets correct ranges      
      const parser: IParser<any> = (target === 'json' ? Parsers.Json : Parsers.Yaml) as unknown as IParser<any>;
      const apiSpecDocument = new SpectralDocument(raw, parser, '');

      //Run sematic validation second(async)
      spectralDiagnostics = await semanticValidate(apiSpecDocument) as SpectralCore.ISpectralDiagnostic[]; 
    }catch (e: any) {
      // If semantic validation crashes, log it and continue parsing flow
      console.error('Spectral semantic validation failed (non-fatal):', e?.message ?? String(e));
      spectralDiagnostics = [];
    }
    const finalIssues = IssueHelper.buildIssuesFromPrettyAndSpectral(prettyLines ?? [], spectralDiagnostics, true  /* addOneToLine */);
    issues = Array.isArray(finalIssues) && finalIssues.length ? finalIssues : undefined;
    issues = finalIssues && finalIssues.length ? finalIssues : undefined;
  }
  return {format: target, raw, parsed: parsedSpec, strictIssues: issues };
}
/**
 * Helper function to decode Base64 encoded string
 * @param base64YamlFile 
 * @returns decoded string
 */
export function decodeBase64String(base64YamlFile: string) {
  // Import the necessary Node.js module (Buffer is built-in)
  const atob = (b64String: string): string =>
    Buffer.from(b64String, "base64").toString("utf-8");
  // Decode the base64 string
  const decodedYaml = atob(base64YamlFile);
  return decodedYaml;
}
/**
 * Helper function to determine if pased object is of type OpenAPI
 */
function isOpenApiLike(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;
  if ('openapi' in obj) return true; // OpenAPI 3.x
  if ('swagger' in obj) return true; // Swagger / OpenAPI 2.0
  // optionally: also accept presence of 'paths' + 'info'
  if ('paths' in obj && 'info' in obj) return true;
  return false;
}
/**
 * - Helper function to strip leading comments and withspaces
 * - Removes lines starting with '#' (SPDX lines) or '//' 
 * - Removes initial blank lines
 * - STOPS when it hits a non-comment line (preserving the rest)
 */
function stripLeadingCommentsAndWhitespace(raw: string): string {
  const lines = raw.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const ln = lines[i].trim();
    if (ln === '' || ln.startsWith('#') || ln.startsWith('//')) {
      i++;
      continue;
    }
    // hantera inledande /* ... */ blockkommentar (om filen inleds med det)
    if (ln.startsWith('/*')) {
      // hitta slutet på blockkommentaren
      let j = i;
      while (j < lines.length && !lines[j].includes('*/')) j++;
      i = j + 1;
      continue;
    }
    break;
  }
  return lines.slice(i).join('\n');
}
function ensureIsSecureOpenApiLike(parsed: any, target: any) {

  const violations: string[] = [];
  //Look for external $refs
  if (findExternalRefs(parsed).length > 0) {
    violations.push('Externa $ref-referenser är ej tillåtna.');
  }
  /*const details = externalRefs
    .map(ref => `${ref.path}: ${ref.ref}`)
    .join('\n');*/
  if (violations.length > 0) {
    throw new SpecParseError([
        'API-specifikationen innehåller konstruktioner som inte är tillåtna enligt säkerhetsreglerna:',
        ...violations.map(v => ` * ${v}`),
      ].join('\n'),{
        source: target,
        stage: 'security',
      },
    );
  }      
  // Add more security controls here if needed.
}
/**
 * Helper function ( High level)
 * Check: parsed object "looks like" OpenAPI (openapi, swagger eller paths+info).
 * Återanvänds när caller redan parsat objektet (eller fått 'parsed' input).
 */
function ensureIsOpenApiLike(parsed: any, target: any) {
  if (!isOpenApiLike(parsed)) {
    throw new SpecParseError('Filen verkar inte vara en giltig OpenAPI-specifikation (saknar openapi/swagger eller paths+info).', { source: target, stage: 'sanity' });
  }
}
/**
 * Helper function ( High level)
 * Check: parsed object "looks like" OpenAPI (openapi, swagger eller paths+info).
 * @param stripped 
 */
function ensureIsNotXmlLike(stripped: string) {
  if (/^\s*<\?xml|^\s*<[\w-]+[\s>]/i.test(stripped)) {
    throw SpecParseError.fromXmlNotice();
  }
}
/**
 *  Helper function ( High level)
 *  Simple heuristic: does the text look like JSON?
 *  Run against stripped text (no SPDX header etc.). * Enkel heuristik: ser texten ut som JSON?
 */
function looksLikeJson(stripped: string): boolean {
  const s = stripped.trimStart();
  return s.startsWith('{') || s.startsWith('[');
}
/**
 *  Helper function ( High level)
 *  Simple heuristic: does the text look like JSON?
 *  Run against stripped text (no SPDX header etc.). * Enkel heuristik: ser texten ut som JSON?
 */
function looksLikeYamlOpenApi(stripped: string): boolean {
  const s = stripped.trimStart();
  if (s.startsWith('openapi:') || s.startsWith('swagger:') || s.startsWith('---') || s.startsWith('info:')) return true;
  return /^[a-zA-Z0-9_-]+\s*:/.test(s);
}
/**
 * Helper function JSON( high level ) 
 * @param raw - raw json
 * @returns return parsed json
 */
function tryParseJson(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch (e: any) {
    // normal JSON parse error -> convert to SpecParseError
    throw SpecParseError.fromJsonError(e);
  }
}

/**
 * Helper function to parse YAML( high level ) 
 * @param raw - raw yaml
 * @returns return parsed yaml
 */
function tryParseYaml(raw: string, maxSnippetLength: number): any {
  try {
    const parsed = yaml.load(raw);
    return parsed;
  } catch (e: any) {
    if (e && typeof e === 'object' && (e.name === 'YAMLException' || e.mark)) {
      const spe = SpecParseError.fromYamlError(e);
      if (spe.snippet && spe.snippet.length > maxSnippetLength) {
        spe.snippet = spe.snippet.slice(0, maxSnippetLength) + '...(truncated)';
      }
      throw spe; // Throw SpecParseError
    }
    // (un)normal JSON parse error -> convert to SpecParseError
    throw new SpecParseError('Kunde inte tolka YAML-innehållet.', { source: 'yaml', stage: 'sanity'});
  }
}
function normalizeRaw(raw: string): string {
  return raw
    .replace(/^\uFEFF/, "")      // ta bort BOM
    .replace(/\r\n/g, "\n")      // normalisera newline
    .replace(/^\s*\n/, "");      // ta bort exakt EN ledande tomrad
}

/**
 * Helper function ( high level ) to get raw from input 
 * @param input 
 * @returns 
 */
export function getRawFromInput(input: SpecInput): string {

  if ('filePath' in input) {
    return fs2.readFileSync(input.filePath, 'utf8');
  } else if ('raw' in input) {
    return input.raw;
  } else if ('base64' in input) {
    return decodeBase64String(input.base64);
  } else if ('parsed' in input) {
    throw new Error('invalid variant to parse with');
  }
  throw new Error('Unexpected error - invalid input when trying to get raw from input');
}

/**
 * Helper function (High level)
 * Run strict validation with @apidevtools/swagger-parser.
 */
async function runStrictValidationIfRequested(parsed: any, source:'yaml' | 'json' | 'xml' | 'unknown' = 'unknown'): Promise<void> {
  try {
    await SwaggerParser.validate(parsed);
  } catch (e: any) {
    // Encapsulate errors in SpecParseError so the rest of the system can handle them uniformly
    const msg = e?.message ? String(e.message) : String(e);
    throw new SpecParseError(`Strict validation failed: ${msg}`, {
       source,
       stage: 'strict',
       cause: e,
    });
  }
}
/**
 * R
 * @returns 
 */
async function ensureFetch(): Promise<typeof globalThis.fetch> {
  if (typeof globalThis.fetch === 'function') return globalThis.fetch;
  // dynamisk import av node-fetch endast om nödvändigt
  const nodeFetch = (await import('node-fetch')).default;
  return nodeFetch as unknown as typeof globalThis.fetch;
}

/**
 * semanticValidate - minimal implementation (Alternativ 1)
 */
export async function semanticValidate(apiSpecDocument: SpectralDocument): Promise<SpectralCore.ISpectralDiagnostic[]> {
  const runner = new RapLPCustomSpectral(); 

  //Hardcoded rules to extend ( Should be able to config thoose)
  let selectedRules: string[] = ['path-params', 'operation-operationId-unique', 'operation-parameters','oas3-schema'];
  //let selectedRules: string[] = ['oas3-schema'];

    // Start of ruleset string to extend ! ( Must look like this)
  const rulesetYaml = `extends: spectral:oas
rules: {}`;
  //Load rules temporary with bundle method
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'spectral-ruleset-'));
  const tmpFile = path.join(tmpDir, '.spectral-temp.yaml');
  await fs.writeFile(tmpFile, rulesetYaml, 'utf8');

  try {
    const fetchImpl = await ensureFetch();
    const bundled = await bundleAndLoadRuleset(tmpFile, { fs: require('fs'), fetch: fetchImpl });

    if (!bundled) throw new Error('bundleAndLoadRuleset returned nothing.');

    // List existing keys and match expecting ones
    const expectedKeys = Object.keys(bundled.rules);
    //console.log('sematicKeys - ExpectedKeys:', expectedKeys);
    const matchingKeys = selectedRules.filter(key => expectedKeys.includes(key));
    //console.log('sematicKeys - MatchingKeys:', matchingKeys);

    //Enable matching rules, disable thoose that dont match
    for (const k of expectedKeys) {
      if (matchingKeys.includes(k)) {
        bundled.rules[k].enabled = true;
      } else {
        bundled.rules[k].enabled = false;
      }
    }
    (runner as any).spectral.setRuleset(bundled);
    let obj: any;
    if ('source' in apiSpecDocument && apiSpecDocument.source) {
      obj = apiSpecDocument.source; // ofta original YAML/JSON som POJO
    } else {
      obj = apiSpecDocument;
    }
    //Run async
    const results = await runner.runSemanticValidation(apiSpecDocument);
  /*console.log('RESULT SPECTRAL :', JSON.stringify(results,null,2));
  console.log('DBG: spectral raw diagnostics (range.start.line may be 0- or 1-based):');
  console.log(JSON.stringify(results.map(r => ({
    code: r.code,
    path: r.path,
    rawRangeStart: r.range?.start?.line ?? null,
    message: r.message
  })), null, 2));    
  */
    return results;
  } finally {
    // Cleanup temporary files
    try { await fs.rm(tmpDir, { recursive: true, force: true }); } catch {}
  }
}
function normalizeSpecRaw(raw: string): string {
  if (typeof raw !== 'string') return raw;
  // 1) Remove BOM if present
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
  // 2) Normalize CRLF -> LF
  raw = raw.replace(/\r\n/g, '\n');
  // 3) Remove leading SPDX block comments (optional — keep if you strip them elsewhere)
  // raw = raw.replace(/^\/\*![\s\S]*?\*\/\n*/, ''); // uncomment if used
  // 4) Remove leading blank lines (one or many)
  raw = raw.replace(/^\n+/, '');
  return raw;
}
function findExternalRefs(parsed: any): ExternalRefFinding[] {
  const findings: ExternalRefFinding[] = [];

  function walk(node: any, path: string) {
    if (!node || typeof node !== 'object') return;

    if (typeof node.$ref === 'string' && isExternalRef(node.$ref)) {
      findings.push({
        path: `${path}.$ref`,
        ref: node.$ref,
      });
    }
    for (const [key, value] of Object.entries(node)) {
      walk(value, path ? `${path}.${escapePathPart(key)}` : escapePathPart(key));
    }
  }
  walk(parsed, '');
  return findings;
}
function isExternalRef(ref: string): boolean {
  const normalized = ref.trim();

  // Endast interna JSON Pointer-referenser tillåts
  return !normalized.startsWith('#/');
}
function escapePathPart(part: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(part)
    ? part
    : `[${JSON.stringify(part)}]`;
}

