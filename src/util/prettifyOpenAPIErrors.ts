/**
 * 
 * @param ptr 
 * @returns 
 */
function decodeJsonPointer(ptr: string): string[] {
  // ptr like "#/paths/~1pets/get/responses/200/..."
  if (!ptr) return [];
  const clean = ptr.replace(/^#/, '').replace(/^\//, '');
  if (!clean) return [];
  return clean.split('/').map(seg => seg.replace(/~1/g, '/').replace(/~0/g, '~'));
}
/**
 * 
 * @param s 
 * @returns 
 */
function escapeForRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Find a best-effort line number (1-based) in rawSpec corresponding to JSON pointer.
 * Strategy:
 *  - decode pointer to path segments
 *  - find first occurrence of segment1 (as YAML/JSON key) then within the following text
 *    find the next segment, etc — progressively narrow down the index range
 *  - fallback: find last segment occurrence in document
 */
function findLineForPointer(rawSpec: string, pointer: string): number | null {
  if (!rawSpec) return null;
  const lines = rawSpec.split(/\r?\n/);
  const segments = decodeJsonPointer(pointer);
  if (!segments.length) return null;

  let searchStartIdx = 0;
  let foundIdx = -1;

  // We'll search sequentially for each segment and move forward
  const rawLower = rawSpec.toLowerCase();

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (!seg) continue;

    // Try several patterns for a key: "seg:", ' "seg":', "'seg':", unquoted seg:
    const candidates: string[] = [];

    // If segment looks like a path segment starting with '/', then key is "/pets"
    candidates.push(`${seg}:`); // e.g. get:
    candidates.push(`'${seg}':`);
    candidates.push(`"${seg}":`);
    // if seg contains slash (application/json) sometimes appears as quoted in YAML or unquoted
    candidates.push(escapeForRegex(seg)); // fallback: plain text match

    // Search in rawSpec starting from searchStartIdx
    let matched = false;
    for (const cand of candidates) {
      // find first occurrence after searchStartIdx
      const idx = rawLower.indexOf(cand.toLowerCase(), searchStartIdx);
      if (idx !== -1) {
        foundIdx = idx;
        searchStartIdx = idx + cand.length; // move forward
        matched = true;
        break;
      }
    }

    if (!matched) {
      // if we cannot find the current segment after the start point,
      // try to find the last segment anywhere and return that line (fallback)
      const lastSeg = segments[segments.length - 1];
      const fallbackIdx = rawLower.lastIndexOf(lastSeg.toLowerCase());
      if (fallbackIdx !== -1) {
        foundIdx = fallbackIdx;
      }
      break;
    }
  }

  if (foundIdx === -1) {
    return null;
  }

  // compute line number from character index
  const prefix = rawSpec.slice(0, foundIdx);
  const line = prefix.split(/\r?\n/).length;
  return line;
}

/**
 * Parse raw swagger-parser style message and produce editor-like lines.
 * Input (errText) typically contains lines starting with "#/paths/..." and then message
 */
export function prettifySwaggerParserErrorToEditorStyle(errText: string, rawSpec: string | null = null): string[] {
  if (!errText) return ["(no error text)"];

  // Normalize CRLF -> LF and split
  const lines = errText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const out: string[] = [];

  for (const line of lines) {
    // Many swagger-parser messages have lines like:
    // "#/paths/~1pets/get/responses/200/content/application~1json/examples must be object"
    const m = line.match(/^(#\/[^\s]+)\s+(.*)$/);
    if (m) {
      const ptr = m[1];
      const rest = m[2];

      // Heuristic: decide "Structural" vs "Semantic" based on common keywords.
      const structuralKeywords = /(must be|must match|should be|should match|format|must have required|should not)/i;
      const semanticKeywords = /(GET operations cannot|Path parameter|OperationId|security)/i;

      const isSemantic = semanticKeywords.test(rest) || /Semantic error/i.test(line);
      const label = isSemantic ? "Semantic error" : "Structural error";

      // Make a readable path: convert pointer to dot-notated like 'paths./pets.get.responses.200...'
      const prettyPath = ptr
        .replace(/^#/, '')
        .split('/')
        .map(seg => seg.replace(/~1/g, '/').replace(/~0/g, '~'))
        .filter(Boolean)
        .join('.');

      out.push(`${label} at ${prettyPath}`);

      // try to clean up rest -> produce short "should ..." line
      // Many messages use "must be object" -> change to "should be object"
      let msg = rest;
      msg = msg.replace(/^must /i, 'should ');
      msg = msg.replace(/oneOf/i, 'oneOf schema');

      out.push(msg);

      // Jump to line: attempt to locate using rawSpec
      let jumpLine: number | null = null;
      if (rawSpec) {
        try {
          jumpLine = findLineForPointer(rawSpec, ptr);
        } catch (e) {
          jumpLine = null;
        }
      }
      if (jumpLine != null) {
        out.push(`Jump to line ${jumpLine}`);
      } else {
        out.push(`Jump to location ${ptr}`);
      }
      continue;
    }

    // If not a #/pointer line, keep as-is but attempt to label
    if (/Swagger schema validation failed/i.test(line)) {
      // ignore header
      continue;
    }

    // fallback: just push the raw line
    out.push(line);
  }

  return out;
}