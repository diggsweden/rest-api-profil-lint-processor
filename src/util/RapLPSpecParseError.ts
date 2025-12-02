
/**
 * Specialized error class that contains YAML/JSON parse information
 * Captured centrally in pipeline (CLI/API), and delivers structured data. 
 */
export class SpecParseError extends Error {
    public line?: number;
    public column?: number;
    public snippet?: string;
    public source?:  'yaml' | 'json' | 'xml' | 'unknown' | 'sanity' | 'strict'; // Source that the error popped from

    constructor(message: string,
       opts?: { line?: number; column?: number; snippet?: string; source?: 'yaml' | 'json' | 'xml' | 'unknown' | 'sanity' | 'strict'}) {
      super(message);
      this.name = 'SpecParseError';
      if (opts) {
        this.line = opts.line;
        this.column = opts.column;
        this.snippet = opts.snippet;
        this.source = opts.source;
      }
      //Remove some buzz from stacktrace
      if (typeof Error.captureStackTrace ==='function') {
        Error.captureStackTrace(this,SpecParseError);
      }
    }
    /*
    * Convinient method to extract yaml Error
    */
    static fromYamlError(yamlErr: any): SpecParseError {
      const msg = (yamlErr && yamlErr.message) ? String(yamlErr.message) : 'Ogiltig YAML-syntax.';
      const mark = yamlErr?.mark;
      const line = typeof mark?.line === 'number' ? mark.line + 1 : undefined;
      const column = typeof mark?.column === 'number' ? mark.column + 1 : undefined;
      const snippet = mark?.snippet;
      return new SpecParseError(msg, { line, column, snippet, source: 'yaml' });
    }
    /*
    * Convinient method to extract json Error
    */
    static fromJsonError(jsonErr: any): SpecParseError {
      const msg = (jsonErr && jsonErr.message) ? String(jsonErr.message) : 'Ogiltig JSON-syntax.';
      return new SpecParseError(msg, { source: 'json' });    
    }
    /*
    * Convinient method to extract xml Error
    */
    static fromXmlNotice(): SpecParseError {
      return new SpecParseError('Innehållet ser ut att vara XML, inte JSON eller YAML.', { source: 'xml' });
    }    
    toJSON() {
      return {
        name: this.name,
        message: this.message,
        source: this.source,
        line: this.line,
        column: this.column,
        snippet: this.snippet,
      };
    }
  }
