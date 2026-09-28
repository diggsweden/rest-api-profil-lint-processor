// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { translator } from '../i18n.js';

/**
 * Specialized error class that contains YAML/JSON parse information
 * Captured centrally in pipeline (CLI/API), and delivers structured data. 
 */
export type SpecParseErrorSource = 'yaml' | 'json' | 'xml' | 'unknown';
export type SpecParseErrorStage = 'sanity' | 'strict' | 'rule-engine' | 'security';

export class SpecParseError extends Error {
    public line?: number;
    public column?: number;
    public snippet?: string;
    /**
     * Source format related to the input or parsing context.
     * Examples: yaml, json, xml.
     * @param message 
     * @param opts 
     */
     public source?: SpecParseErrorSource;
    /**
     * Stage in pipeline where the error was detected.
     * Examples: sanity, strict, rule-engine.
     */
    public stage?: SpecParseErrorStage;
    public cause?: unknown;
     

    //public source?:  'yaml' | 'json' | 'xml' | 'unknown' | 'sanity' | 'strict' | 'rule-engine'; // Source that the error popped from
    //public stage?: 'sanity' | 'strict' | 'rule-engine';

    /*
    constructor(message: string,
       opts?: { line?: number; column?: number; snippet?: string; source?: 'yaml' | 'json' | 'xml' | 'unknown' | 'sanity' | 'strict' | 'rule-engine'; cause?:unknown}) {
      super(message);
      this.name = 'SpecParseError';
      if (opts) {
        this.line = opts.line;
        this.column = opts.column;
        this.snippet = opts.snippet;
        this.source = opts.source;
        this.cause = opts.cause;
      }
      //Remove some buzz from stacktrace
      if (typeof Error.captureStackTrace ==='function') {
        Error.captureStackTrace(this,SpecParseError);
      }
    }
    */
  constructor(
    message: string,
    opts?: {
      line?: number;
      column?: number;
      snippet?: string;
      source?: SpecParseErrorSource;
      stage?: SpecParseErrorStage;
      cause?: unknown;
    }
  ) {
    super(message);
    this.name = 'SpecParseError';

    if (opts) {
      this.line = opts.line;
      this.column = opts.column;
      this.snippet = opts.snippet;
      this.source = opts.source;
      this.stage = opts.stage;
      this.cause = opts.cause;
    }

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, SpecParseError);
    }
  }

    /*
    * Convinient method to extract yaml Error
    */
    static fromYamlError(yamlErr: any, t: ReturnType<typeof translator>): SpecParseError {
      const msg = (yamlErr && yamlErr.message) ? String(yamlErr.message) : t('validation.invalidYamlSyntax');
      const mark = yamlErr?.mark;
      const line = typeof mark?.line === 'number' ? mark.line + 1 : undefined;
      const column = typeof mark?.column === 'number' ? mark.column + 1 : undefined;
      const snippet = mark?.snippet;
      return new SpecParseError(msg, 
        { line, 
          column, 
          snippet, 
          source: 'yaml',
          stage: 'sanity',
          cause:yamlErr 
        });
    }
    /*
    * Convinient method to extract json Error
    */
    static fromJsonError(jsonErr: any, t: ReturnType<typeof translator>): SpecParseError {
      const msg = (jsonErr && jsonErr.message) ? String(jsonErr.message) : t('validation.invalidJsonSyntax');
      return new SpecParseError(msg,
        { 
          source: 'json',
          stage: 'sanity',
          cause: jsonErr   
        });    
    }
  /*
   * Known rule-engine case:
   * The specification was parsed, but the rule engine crashed because
   * required OpenAPI structure was missing and strict validation was disabled.
   */
    static fromRuleEngineInvalidStructure(causeErr: unknown, t: ReturnType<typeof translator>): SpecParseError {
      return new SpecParseError(
      t('validation.ruleEngineInvalidStructure'),
      { stage: 'rule-engine',
        cause: causeErr,
      });
    }
    /*
    * Convinient method to extract xml Error
    */
    static fromXmlNotice(t: ReturnType<typeof translator>): SpecParseError {
      return new SpecParseError(t('validation.xmlContentDetected'), { source: 'xml' });
    }    
    toJSON() {
      return {
        name: this.name,
        message: this.message,
        source: this.source,
        stage: 'sanity',
        line: this.line,
        column: this.column,
        snippet: this.snippet,
      };
    }
  }
