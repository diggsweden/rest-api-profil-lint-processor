// SPDX-FileCopyrightText: 2026 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

async function main() {
  const arg = process.argv[2] || '{}';
  const input = JSON.parse(arg);

  try {
    const { ExcelReportProcessor } = await import('../../../dist/util/excelReportProcessor.js');

    const toRules = (ids = []) => ids.map((id) => ({ id }));
    const diagnostic = {
      diagnosticInformation: {
        executedUniqueRules: toRules(input.ok),
        executedUniqueRulesWithError: toRules(input.nok),
        notApplicableRules: toRules(input.na),
      },
    };

    const processor = new ExcelReportProcessor({ outputFilePath: input.outputFilePath });
    processor.generateReportDocument(diagnostic);

    console.log(
      JSON.stringify({
        ok: true,
        result: {
          outputFilePath: processor.outputFilePath,
          isBasedOnExistingFile: processor.isBasedOnExistingFile,
          templateProfileVersion: processor.templateProfileVersion,
          fileProfileVersion: processor.fileProfileVersion,
          keptInProgressRules: processor.keptInProgressRules,
          resolvedInProgressRules: processor.resolvedInProgressRules,
          missingRules: processor.missingRules,
        },
      }),
    );
    process.exit(0);
  } catch (err) {
    console.error(JSON.stringify({ ok: false, message: err?.message, stack: err?.stack }));
    process.exit(2);
  }
}

main();
