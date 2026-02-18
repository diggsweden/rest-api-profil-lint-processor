// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import { CustomProperties } from '../ruleinterface/CustomProperties.js';

interface RuleExecutionInfo {
  moduleName: string;
  className: string;
  customProperties: CustomProperties;
  severity: string;
  passed: boolean;
  targetVal: string;
}

export interface RuleExecutionLog {
  [key: string]: RuleExecutionInfo[];
}
/**
 * 
 */
export class RuleExecutionContext {
  public ruleExecutionLogDictionary: RuleExecutionLog = {};
  // Define an object to store rule execution status
  public ruleExecutionStatus: Record<string, boolean> = {};

// Function to register module and class information
  registerRuleExecutionStatus(
    moduleName: string,
    className: string,
    customProperties: CustomProperties,
    severity: string,
  ) {
    const key = `${moduleName}:${customProperties.id}:${customProperties.område}:${severity}`;
    this.ruleExecutionStatus[key] = true;
  }

// Function to register module and class information
  logRuleExecution(
    moduleName: string,
    className: string,
    customProperties: CustomProperties,
    severity: string,
    passed: boolean,
    targetVal: string,
  ) {
    const key = `${moduleName}:${customProperties.id}:${customProperties.område}:${severity}`;

    if (!this.ruleExecutionLogDictionary[key]) {
      this.ruleExecutionLogDictionary[key] = [];
    }

    this.ruleExecutionLogDictionary[key].push({
      moduleName,
      className,
      customProperties,
      severity,
      passed,
      targetVal,
    });
  }
}