// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

import path from 'path';

async function main() {
  const arg = process.argv[2] || '{}';
  const input = JSON.parse(arg);

  try {
    
    const { parseApiSpecInput } = await import('../../../dist/util/validateUtil.js');

    const res = await parseApiSpecInput(input, { strict: !!input.strict });
    console.log(JSON.stringify({ ok: true, result: res }));
    process.exit(0);
  } catch (err) {
    console.error(JSON.stringify({ ok: false, message: err?.message, stack: err?.stack }));
    process.exit(2);
  }
}

main();
