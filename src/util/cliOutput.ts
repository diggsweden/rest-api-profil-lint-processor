// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2
import chalk from 'chalk';
import { t } from 'i18next';
import { Issue } from './Issue.js';
import { RapLPCustomSpectralDiagnostic } from './RapLPCustomSpectralDiagnostic.js';

export function printOkRules(executedUniqueRules: any) {
  console.log(chalk.green(t('cli.ruleExecution.approvedTitle') + '\r'));
  console.log(
    chalk.whiteBright(t('cli.ruleExecution.headers.status')) +
      '\t' +
      chalk.whiteBright(t('cli.ruleExecution.headers.area')) +
      ' / ' +
      chalk.whiteBright(t('cli.ruleExecution.headers.identifier')),
  );
  executedUniqueRules
    .sort((a, b) => a.id.localeCompare(b.id, 'sv'))
    .forEach((item) => {
      console.log(chalk.bgGreen(t('common.ruleStatus.ok')) + '\t' + item.area + ' / ' + item.id);
    });
}

export function printNokRules(executedUniqueRulesWithError: any) {
  console.log(chalk.green(t('cli.ruleExecution.rejectedTitle') + '\r'));
  console.log(
    chalk.whiteBright(t('cli.ruleExecution.headers.status')) +
      '\t' +
      chalk.whiteBright(t('cli.ruleExecution.headers.area')) +
      ' / ' +
      chalk.whiteBright(t('cli.ruleExecution.headers.identifier')),
  );
  executedUniqueRulesWithError
    .sort((a, b) => a.id.localeCompare(b.id, 'sv'))
    .forEach((item) => {
      console.log(chalk.bgRed(t('common.ruleStatus.notOk')) + '\t' + item.area + ' / ' + item.id);
    });
}

export function printNaRules(notApplicableRules: any) {
  console.log(chalk.green(t('cli.ruleExecution.notApplicableTitle') + '\r'));
  console.log(
    chalk.whiteBright(t('cli.ruleExecution.headers.status')) +
      '\t' +
      chalk.whiteBright(t('cli.ruleExecution.headers.area')) +
      ' / ' +
      chalk.whiteBright(t('cli.ruleExecution.headers.identifier')),
  );
  notApplicableRules
    .sort((a, b) => a.id.localeCompare(b.id, 'sv'))
    .forEach((item) => {
      console.log(chalk.bgGrey(t('common.ruleStatus.notApplicable')) + '\t' + item.area + '/' + item.id);
    });
}

export function printSummary(outcome: any, notApplicable: number) {
  console.log(chalk.whiteBright(`\n${t('cli.ruleExecution.summaryTitle')}`));
  console.log(
    [
      chalk.green(`${t('common.ruleStatus.ok')}: ${outcome.passed}`),
      chalk.red(`${t('common.ruleStatus.notOk')}: ${outcome.failed}`),
      chalk.gray(`${t('common.ruleStatus.notApplicable')}: ${notApplicable}`),
    ].join(' | '),
  );
}

export function printStrictIssues(strictIssues: Issue[]) {
  console.log(t('cli.strictValidationIssues'));
  strictIssues.forEach((iss: Issue) =>
    console.log(
      chalk.yellow(
        `- ${iss.type} ${t('cli.atLabel')} ${iss.path} : ${iss.message} ${
          iss.line ? `(${t('cli.lineLabel').toLowerCase()} ${iss.line})` : ''
        }`,
      ),
    ),
  );
}

export function printVerboseResult(result: RapLPCustomSpectralDiagnostic[]) {
  console.log(chalk.whiteBright(`\n\n${t('cli.ruleExecution.resultTitle')}`));
  result
    .sort((a, b) => {
      const idA = a.id ?? '';
      const idB = b.id ?? '';
      return idA.localeCompare(idB, 'sv');
    })
    .forEach((item) => {
      console.log(formatLintingResult(item));
    });
}

const formatLintingResult = (result: any) => {
  return `\n${t('cli.ruleExecution.details.severity')}: ${colorizeSeverity(result.severity)} \n${t(
    'cli.ruleExecution.details.id',
  )}: ${result.id} \n${t('cli.ruleExecution.details.requirement')}: ${result.requirement} \n${t(
    'cli.ruleExecution.details.area',
  )}: ${result.area} \n${t('cli.ruleExecution.details.path')}:[${result.path}] \n${t(
    'cli.ruleExecution.details.range',
  )}:${JSON.stringify(result.range, null, 2)}\n${t('cli.ruleExecution.details.designRule')}: ${result.helpUrl} `;
};

/**
 * Chalk impl.
 * @param allvarlighetsgrad
 * @returns
 */
// Run Spectral on the API specification and log the result
const colorizeSeverity = (allvarlighetsgrad: string) => {
  switch (allvarlighetsgrad) {
    case 'ERROR': // Error
      return chalk.red('Error');
    case 'WARNING': // Warning
      return chalk.yellow('Warning');
    case 'HINT': // Info
      return chalk.greenBright('Hint');
    default:
      return chalk.white('Info');
  }
};
