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
