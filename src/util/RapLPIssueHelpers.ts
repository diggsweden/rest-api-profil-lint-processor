// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import type * as SpectralCore from '@stoplight/spectral-core';

/**
 * Issue type to use from client to validate parsing
 */
export type Issue = {
  type: 'Structural' | 'Semantic' | 'Info' | string;
  code?: string | number;  // ex 'path-params' (från Spectral)
  path: string;            // ex "paths./pets.get.responses.200"
  message: string;         // ex "should be object" eller spectral message
  line?: number | null;    // 1-based line if available (null annars)
  location?: string;       // fallback location or original pointer
  source?: string;         // file path / source (if available)
  documentationUrl?: string;// optional link
  raw?: string[];          // original lines that created this issue (optional)
  details?: string[];      // extra details (optional)
};
/**
 * Extract jumplines
 * @param prettyLines 
 * @returns 
 */
function extractJumpLinesFromPretty(prettyLines?: string[]): Set<number> {
  const s = new Set<number>();
  if (!Array.isArray(prettyLines)) return s;
  for (const l of prettyLines) {
    if (typeof l !== 'string') continue;
    const m = l.match(/Jump to line\s+(\d+)/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!Number.isNaN(n)) s.add(n);
    }
  }
  return s;
}
/**
 * 
 * @param diagnostics 
 * @param prettyLines 
 * @param fallbackAddOne 
 * @returns 
 */
export function spectralDiagnosticsToIssuesSimple(
  diagnostics: SpectralCore.ISpectralDiagnostic[] | readonly SpectralCore.ISpectralDiagnostic[] | undefined,
  prettyLines?: string[],
  fallbackAddOne = false // If no ref, choose thisone
): Issue[] {
  const issues: Issue[] = [];
  if (!diagnostics || diagnostics.length === 0) return issues;

  const jumpSet = extractJumpLinesFromPretty(prettyLines);
  const useJumpRef = jumpSet.size > 0;

  for (const d of diagnostics as SpectralCore.ISpectralDiagnostic[]) {
    const pathArr = Array.isArray(d.path) ? d.path : [];
    const path = pathArr.join('.');
    const rawLine = d.range && d.range.start && typeof d.range.start.line === 'number' ? d.range.start.line : null;

    let line: number | null = null;
    if (rawLine !== null) {
      if (useJumpRef) {
        // Om prettifier har rawLine+1 så använd +1, annars använd rawLine 
        if (jumpSet.has(rawLine + 1)) {
          line = rawLine + 1;
        } else {
          line = rawLine;
        }
      } else {
        // No ref  — fallback 
        line = fallbackAddOne ? rawLine + 1 : rawLine;
      }
    }
    //Create Issue
    issues.push({
      type: 'Semantic',
      code: d.code ?? undefined,
      path: path || '',
      message: d.message ?? '',
      line: line ?? null,
      location: d.source ?? (path || undefined),
      source: d.source ?? undefined,
      documentationUrl: (d as any).documentationUrl ?? undefined,
      raw: undefined,
      details: undefined,
    });
  }
  return issues;
}

/**
 * Helper function to converts Spectral ISpectralDiagnostic[] to Issue[].
 * @param diagnostics 
 * @param addOneToLine 
 * @returns Issue array
 */
 export function spectralDiagnosticsToIssues(diagnostics: SpectralCore.ISpectralDiagnostic[] | 
    readonly SpectralCore.ISpectralDiagnostic[], addOneToLine = true): Issue[] {
  const issues: Issue[] = [];
  if (!diagnostics || diagnostics.length === 0) return issues;

  for (const d of diagnostics as SpectralCore.ISpectralDiagnostic[]) {
    const pathArr = Array.isArray(d.path) ? d.path : [];
    const path = pathArr.join('.');
    const rawLine = d.range && d.range.start && typeof d.range.start.line === 'number' ? d.range.start.line : null;
    const line = rawLine !== null ? (addOneToLine ? rawLine + 1 : rawLine) : null;

    issues.push({
      type: 'Semantic',
      code: d.code ?? undefined,
      path: path || '',
      message: d.message ?? '',
      line: line ?? null,
      location: d.source ??( path || undefined),
      source: d.source ?? undefined,
      documentationUrl: (d as any).documentationUrl ?? undefined,
      raw: undefined,
      details: undefined,
    });
  }
  return issues;
}
/**
* Merges two Issue arrays (e.g. parsedPretty + spectralIssues).
* Deduplicates (based on path+message+line).
* Sets priority: if an issue already exists from prettyLines, keep it (softer).
*/
export function mergeAndDedupeIssues(prettyIssues: Issue[], spectralIssues: Issue[]): Issue[] {
  const all = [...(prettyIssues || []), ...(spectralIssues || [])];

  const groups = new Map<string, Issue[]>();

  const normalizePath = (p?: string) => (p ?? '').toString().trim();

  // Map key: line + normalized path-root.
  // Group by line number first (if available), then try to group paths that are parent/child.
  for (const iss of all) {
    const linePart = iss.line != null ? String(iss.line) : '_noline_';
    const path = normalizePath(iss.path || iss.location || '');
    const baseKey = `${linePart}`;

    // collect in that line group
    if (!groups.has(baseKey)) groups.set(baseKey, []);
    groups.get(baseKey)!.push(iss);
  }

  const result: Issue[] = [];

  // For each line-group, try to merge by best matching paths (semantic-promote)
  for (const [lineKey, group] of groups.entries()) {
    // if group only one => push as-is
    if (!group || group.length === 0) continue;
    if (group.length === 1) {
      result.push({ ...group[0] });
      continue;
    }

    // Strategy: find any Semantic entries; if exist, promote them and attach other messages as details
    const semanticEntries = group.filter(g => (g.type ?? '').toLowerCase() === 'semantic');
    if (semanticEntries.length > 0) {
      // Prefer the most specific semantic (longest path) if multiple
      semanticEntries.sort((a, b) => (b.path || '').length - (a.path || '').length);
      const primary = { ...semanticEntries[0] }; // promote
      const details = new Set<string>(primary.details ?? []);

      for (const other of group) {
        // skip the primary itself
        if (other === semanticEntries[0]) continue;
        // add the other.message if not identical
        if (other.message && other.message !== primary.message) details.add(other.message);
        // also include raw lines if present
        if (Array.isArray(other.raw)) for (const r of other.raw) details.add(String(r).trim());
        // copy missing metadata
        if (!primary.documentationUrl && other.documentationUrl) primary.documentationUrl = other.documentationUrl;
        if (!primary.source && other.source) primary.source = other.source;
      }

      primary.details = Array.from(details).filter(Boolean);
      // ensure location fallback set
      if (!primary.location || primary.location === '') primary.location = primary.path || group[0].path || '';
      result.push(primary);
      continue;
    }

    // No semantic entries -> try to find if there is a "most specific" structural entry to keep as primary
    // pick the entry with longest path as primary, others go to details
    group.sort((a, b) => (b.path || '').length - (a.path || '').length);
    const primaryStruct = { ...group[0] };
    const detailsSet = new Set<string>(primaryStruct.details ?? []);
    for (let i = 1; i < group.length; i++) {
      const other = group[i];
      if (other.message && other.message !== primaryStruct.message) detailsSet.add(other.message);
      if (Array.isArray(other.raw)) for (const r of other.raw) detailsSet.add(String(r).trim());
      primaryStruct.documentationUrl = primaryStruct.documentationUrl ?? other.documentationUrl;
      primaryStruct.source = primaryStruct.source ?? other.source;
    }
    primaryStruct.details = Array.from(detailsSet).filter(Boolean);
    if (!primaryStruct.location || primaryStruct.location === '') primaryStruct.location = primaryStruct.path || '';
    result.push(primaryStruct);
  }

  // final deterministic sort: by source, then line, then path
  result.sort((a, b) => {
    const sa = `${a.source ?? ''}|${String(a.line ?? 0).padStart(6, '0')}|${a.path ?? ''}`;
    const sb = `${b.source ?? ''}|${String(b.line ?? 0).padStart(6, '0')}|${b.path ?? ''}`;
    return sa.localeCompare(sb);
  });

  return result;
}
export function consolidateIssues(issues: Issue[]): Issue[] {
  if (!issues || issues.length === 0) return [];

  const normalizeMsg = (s?: string) => (s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  const normalizePath = (p?: string) => (p ?? '').toString().trim();

  // Key now: path + line (group by location), not path+message
  const map = new Map<string, Issue>();

  const priorityScore = (type?: string) => {
    if (!type) return 0;
    const t = type.toLowerCase();
    if (t === 'semantic') return 3;
    if (t === 'structural') return 2;
    if (t === 'info') return 1;
    return 0;
  };

  for (const rawIss of issues) {
    const iss: Issue = { ...rawIss }; // shallow copy
    iss.path = normalizePath(iss.path);
    iss.message = (iss.message ?? '').trim();

    const linePart = iss.line != null ? String(iss.line) : '_noline_';
    const key = `${iss.path}|${linePart}`;

    const existing = map.get(key);
    if (!existing) {
      // ensure details is array
      if (!Array.isArray(iss.details)) iss.details = [];
      if (iss.raw && !Array.isArray(iss.raw)) iss.raw = [String(iss.raw)];
      map.set(key, iss);
      continue;
    }

    // If incoming has higher priority (e.g. Semantic > Structural) - replace as primary
    if (priorityScore(iss.type) > priorityScore(existing.type)) {
      // preserve existing as detail(s)
      const details = new Set<string>(existing.details ?? []);
      if (existing.message && existing.message !== iss.message) details.add(existing.message);
      if (existing.raw && Array.isArray(existing.raw)) {
        for (const r of existing.raw) details.add(String(r).trim());
      }
      // merge existing.details too
      if (Array.isArray(existing.details)) {
        for (const d of existing.details) details.add((d ?? '').toString().trim());
      }

      iss.details = Array.from(new Set([...(iss.details ?? []), ...Array.from(details)])).filter(Boolean);
      // copy metadata if missing on new
      if (!iss.documentationUrl) iss.documentationUrl = existing.documentationUrl;
      if (!iss.source) iss.source = existing.source;
      // keep smallest non-null line if new misses it
      if ((iss.line == null || iss.line === 0) && (existing.line != null)) iss.line = existing.line;
      map.set(key, iss);
    } else {
      // Keep existing primary; merge incoming into details
      const details = new Set<string>(existing.details ?? []);
      if (iss.message && iss.message !== existing.message) details.add(iss.message);
      if (Array.isArray(iss.details)) for (const d of iss.details) details.add(d);
      if (Array.isArray(iss.raw)) for (const r of iss.raw) details.add(String(r).trim());
      existing.details = Array.from(details).filter(Boolean);
      // keep smallest non-null line if existing missing
      if ((existing.line == null || existing.line === 0) && (iss.line != null)) existing.line = iss.line;
      existing.documentationUrl = existing.documentationUrl ?? iss.documentationUrl;
      existing.source = existing.source ?? iss.source;
      map.set(key, existing);
    }
  }

  // Convert to array
  let merged = Array.from(map.values());

  // Filter: ta bort generiska oneOf-meddelanden om specifika finns i samma parent path
  merged = merged.filter(i => {
    if (i.message && /oneOf schema/i.test(i.message)) {
      const parent = i.path.split('.').slice(0, -1).join('.');
      const hasSpecific = merged.some(o => o.path.startsWith(parent) && !/oneOf schema/i.test(o.message));
      if (hasSpecific) return false;
    }
    return true;
  });

  // Sort determenistic: source, line (nummer), path
  merged.sort((a, b) => {
    const sa = `${a.source ?? ''}|${String(a.line ?? 0).padStart(6, '0')}|${a.path ?? ''}`;
    const sb = `${b.source ?? ''}|${String(b.line ?? 0).padStart(6, '0')}|${b.path ?? ''}`;
    return sa.localeCompare(sb);
  });

  // Trim messages & details, dedupe details
  for (const i of merged) {
    i.message = (i.message ?? '').trim();
    if (i.details && Array.isArray(i.details)) {
      i.details = Array.from(new Set(i.details.map(d => (d ?? '').toString().trim()))).filter(Boolean);
    }
  }

  return merged;
}

/**
 * ConsolidateIssues
 * @param issues 
 * @returns 
 */
export function consolidateIssues2(issues: Issue[]): Issue[] {
  if (!issues || issues.length === 0) return [];

  // Normaliseringshjälpare
  const normalizeMsg = (s?: string) => (s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  const normalizePath = (p?: string) => (p ?? '').toString().trim();

  // Key: slå ihop på path + normalized message (för att gruppera nära relaterade issues)
  const map = new Map<string, Issue>();

  const priorityScore = (type?: string) => {
    if (!type) return 0;
    const t = type.toLowerCase();
    if (t === 'semantic') return 3;
    if (t === 'structural') return 2;
    if (t === 'info') return 1;
    return 0;
  };

  for (const rawIss of issues) {
    const iss: Issue = { ...rawIss }; // copy to avoid mutation
    iss.path = normalizePath(iss.path);
    iss.message = (iss.message ?? '').trim();

    const key = `${iss.path}|${normalizeMsg(iss.message)}`;

    const existing = map.get(key);
    if (!existing) {
      // ensure details is array
      if (!Array.isArray(iss.details)) iss.details = [];
      if (iss.raw && !Array.isArray(iss.raw)) iss.raw = [String(iss.raw)];
      map.set(key, iss);
      continue;
    }

    // If incoming has higher priority (e.g. Semantic > Structural) - replace as primary
    if (priorityScore(iss.type) > priorityScore(existing.type)) {
      // preserve existing as detail(s)
      const details = new Set<string>(existing.details ?? []);
      if (existing.message && existing.message !== iss.message) details.add(existing.message);
      if (existing.raw && Array.isArray(existing.raw)) {
        for (const r of existing.raw) details.add(String(r).trim());
      }
      iss.details = Array.from(new Set([...(iss.details ?? []), ...Array.from(details)])).filter(Boolean);
      // copy metadata if missing on new
      if (!iss.documentationUrl) iss.documentationUrl = existing.documentationUrl;
      if (!iss.source) iss.source = existing.source;
      map.set(key, iss);
    } else {
      // Keep existing primary; merge incoming into details
      const details = new Set<string>(existing.details ?? []);
      if (iss.message && iss.message !== existing.message) details.add(iss.message);
      if (Array.isArray(iss.details)) for (const d of iss.details) details.add(d);
      if (Array.isArray(iss.raw)) for (const r of iss.raw) details.add(String(r).trim());
      existing.details = Array.from(details).filter(Boolean);
      // keep smallest non-null line if existing missing
      if ((existing.line == null || existing.line === 0) && (iss.line != null)) existing.line = iss.line;
      existing.documentationUrl = existing.documentationUrl ?? iss.documentationUrl;
      existing.source = existing.source ?? iss.source;
      map.set(key, existing);
    }
  }

  // Convert to array
  let merged = Array.from(map.values());

  // Filter: ta bort generiska oneOf-meddelanden om specifika finns i samma parent path
  merged = merged.filter(i => {
    if (i.message && /oneOf schema/i.test(i.message)) {
      const parent = i.path.split('.').slice(0, -1).join('.');
      const hasSpecific = merged.some(o => o.path.startsWith(parent) && !/oneOf schema/i.test(o.message));
      if (hasSpecific) return false;
    }
    return true;
  });

  // Sort determenistic: source, line (nummer), path
  merged.sort((a, b) => {
    const sa = `${a.source ?? ''}|${String(a.line ?? 0).padStart(6, '0')}|${a.path ?? ''}`;
    const sb = `${b.source ?? ''}|${String(b.line ?? 0).padStart(6, '0')}|${b.path ?? ''}`;
    return sa.localeCompare(sb);
  });

  // Trim messages & details, dedupla details
  for (const i of merged) {
    i.message = (i.message ?? '').trim();
    if (i.details && Array.isArray(i.details)) {
      i.details = Array.from(new Set(i.details.map(d => (d ?? '').toString().trim()))).filter(Boolean);
    }
  }

  return merged;
}
/**
 * Format a single Issue into editor-like lines (no duplicates).
 */
export function formatIssueAsEditorLines(issue: Issue): string[] {
  const lines: string[] = [];

  const typ = (issue.type ?? 'Error').toString();
  const target = issue.path || issue.location || '<unknown>';
  const header = `${typ} error at ${target}`;

  // header
  lines.push(header);

  // message
  const msg = (issue.message ?? '').toString().trim();
  if (msg) lines.push(msg);

  // details (only ones that are not identical to message)
  if (Array.isArray(issue.details) && issue.details.length) {
    for (const d of issue.details) {
      const dd = (d ?? '').toString().trim();
      if (!dd) continue;
      if (dd === msg) continue; // skip duplicate
      lines.push(dd);
    }
  }

  // If raw is present, include only lines from raw that are not duplicates of already included lines
  if (Array.isArray(issue.raw) && issue.raw.length) {
    for (const r of issue.raw) {
      const rr = (r ?? '').toString().trim();
      if (!rr) continue;
      // skip if it's identical to header, msg, any details or "Jump to line ..." (we will add jump ourselves)
      if (rr === header) continue;
      if (rr === msg) continue;
      if ((issue.details || []).some(d => (d ?? '').toString().trim() === rr)) continue;
      if (/^Jump to line\s+\d+/i.test(rr)) continue;
      lines.push(rr);
    }
  }

  // Jump to line (prefer issue.line if present)
  const l = normalizeLine(issue.line);
  if (l) lines.push(`Jump to line ${l}`);

  return lines;
}
function normalizeLine(line?: number | null): number | undefined {
  if (typeof line === 'number' && Number.isFinite(line) && line > 0) return line;
  return undefined;
}
/**
 * Format entire Issue[] as a single editor-like text block.
 * Ensures issues are separated by a blank line.
 */
export function formatIssuesAsEditorText(issues: Issue[]): string {
  if (!Array.isArray(issues) || issues.length === 0) return '';

  // We'll assume caller has already consolidated & sorted issues.
  const blocks: string[] = [];
  for (const issue of issues) {
    const lines = formatIssueAsEditorLines(issue);
    if (lines.length) blocks.push(lines.join('\n'));
  }
  return blocks.join('\n\n');
}
export function parsePrettyLinesToIssues(prettyLines: string[]): Issue[] {
  const issues: Issue[] = [];
  if (!prettyLines || prettyLines.length === 0) return issues;

  // normalize: convert strings with surrounding spaces removed
  const lines = prettyLines.map(l => (typeof l === 'string' ? l.trim() : String(l)));

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Match "Structural error at <path>" or "Semantic error at <path>"
    const atMatch = line.match(/^(Structural|Semantic|Info|Warning|Error)\s+error\s+at\s+(.+)$/i)
      || line.match(/^(Structural|Semantic|Info|Warning|Error)\s+at\s+(.+)$/i);

    if (atMatch) {
      const rawType = atMatch[1];
     // path might be in group 3 (if matched "at <path>") or group 2 otherwise
      const path = (atMatch[3] ?? atMatch[2] ?? '').trim();      //const path = atMatch[2].trim();

      // Next non-empty line(s) are the descriptive message(s) until "Jump to ..."
      let j = i + 1;
      const msgParts: string[] = [];
      let lineNumber: number | null = null;
      let location: string | undefined;

      while (j < lines.length) {
        const nxt = lines[j];

        // If next is "Jump to line N" or "Jump to location #/..."
        const jumpLineMatch = nxt.match(/^Jump to line\s+(\d+)$/i);
        const jumpLocMatch = nxt.match(/^Jump to location\s+(.+)$/i);

        if (jumpLineMatch) {
          lineNumber = parseInt(jumpLineMatch[1], 10);
          j++;
          break;
        } else if (jumpLocMatch) {
          location = jumpLocMatch[1].trim();
          j++;
          // there still might be a "Jump to line" after location, so continue loop
          continue;
        }

        // If next line looks like the start of another issue, break
        if (/^(Structural|Semantic|Info|Warning|Error)\s+(error\s+)?at\s+/i.test(nxt)) {
          break;
        }

        // Otherwise treat as message content
        msgParts.push(nxt);
        j++;
      }

      const message = msgParts.join(' ').trim() || '(no message)';
      issues.push({
        type: rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase(),
        path,
        message,
        line: lineNumber ?? null,
        location: location ?? path, // path as fallback
        raw: lines.slice(i, j),
      });

      i = j;
      continue;
    }

    // fallback: if line looks like "Jump to line" alone, attach to last issue if present
    const jumpOnly = line.match(/^Jump to line\s+(\d+)$/i);
    if (jumpOnly && issues.length > 0) {
      issues[issues.length - 1].line = parseInt(jumpOnly[1], 10);
      i++;
      continue;
    }

    // fallback: plain text line — put as Info entry if nothing else
    issues.push({
      type: 'Info',
      path: '',
      message: line,
      line: null,
      location: undefined,
      raw: [line],
    });
    i++;
  }
  return issues;
}
/**
 * 
 * @param issues 
 * @returns 
 */
export function dedupeIssues(issues: Issue[]): Issue[] {
  const map = new Map<string, Issue>();
  for (const is of issues) {
    const key = `${is.type}|${is.path}|${is.message}|${is.line ?? ''}`;
    if (!map.has(key)) map.set(key, is);
  }
  return Array.from(map.values());
}
export function sortIssues(issues: Issue[] | undefined): Issue[] {
  if (!Array.isArray(issues) || issues.length === 0) return [];

  const priority = (t?: string) => {
    if (!t) return 0;
    const tt = t.toString().toLowerCase();
    if (tt === 'semantic') return 4;
    if (tt === 'structural') return 3;
    if (tt === 'info') return 2;
    return 1;
  };

  // Returnera en ny array, håll originalen orörd
  const copy = issues.slice();

  copy.sort((a, b) => {
    // 1) line (null/undefined last)
    const la = typeof a.line === 'number' ? a.line : Number.MAX_SAFE_INTEGER;
    const lb = typeof b.line === 'number' ? b.line : Number.MAX_SAFE_INTEGER;
    if (la !== lb) return la - lb;

    // 2) path
    const pa = (a.path ?? '').toString();
    const pb = (b.path ?? '').toString();
    const pathCmp = pa.localeCompare(pb, undefined, { sensitivity: 'base' });
    if (pathCmp !== 0) return pathCmp;

    // 3) type priority (higher first)
    const prioDiff = priority(b.type) - priority(a.type);
    if (prioDiff !== 0) return prioDiff;

    // 4) tiebreaker: code then message
    const ca = (a.code ?? '').toString();
    const cb = (b.code ?? '').toString();
    const codeCmp = ca.localeCompare(cb, undefined, { sensitivity: 'base' });
    if (codeCmp !== 0) return codeCmp;

    const ma = (a.message ?? '').toString();
    const mb = (b.message ?? '').toString();
    return ma.localeCompare(mb, undefined, { sensitivity: 'base' });
  });

  return copy;
}
/**
 * Helper function (highlevel) to go from from prettyLines and SpectralDiagnostic to specified Issue format
 * @param prettyLines - result from AJV parsing
 * @param spectralDiagnostics - result from Spectral parsing
 * @param addOneToLine - boolean to move pointer one line or not 
 * @returns sorted Issue list
 */
export function buildIssuesFromPrettyAndSpectral(prettyLines: string[], 
  spectralDiagnostics: SpectralCore.ISpectralDiagnostic[] | readonly SpectralCore.ISpectralDiagnostic[], addOneToLine = true):Issue[] {

    const pretty = parsePrettyLinesToIssues(prettyLines);
    const spec = spectralDiagnosticsToIssues(spectralDiagnostics,addOneToLine);
    //const spec = spectralDiagnosticsToIssuesSimple(spectralDiagnostics,prettyLines,addOneToLine);
    const merged  = mergeAndDedupeIssues(pretty,spec);
    const consolidated = consolidateIssues(merged); 
    const sorted = sortIssues(consolidated);
    return sorted;
}
