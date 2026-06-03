// SPDX-FileCopyrightText: 2026 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

const PERF_LOGGING = process.env.RAP_LP_PERF_LOGGING === 'true';


export async function measure(metadata, fn) {
  if (!PERF_LOGGING) {
    return await fn();
  }

  const start = performance.now();

  try {
    return await fn();
  } finally {
    const durationMs = Math.round(performance.now() - start);

    console.log(JSON.stringify({
      type: 'performance',
      ...metadata,
      durationMs
    }));
  }
}