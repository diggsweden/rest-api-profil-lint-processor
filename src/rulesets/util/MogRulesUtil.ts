// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

export const countEndpoints = (apiPaths: Record<string, any>): number => {
  return Object.keys(apiPaths).length;
};

export const endPointsAreValid = (apiPaths: Record<string, any>): boolean => {
  const validHttpMethods = ['get', 'post', 'put', 'delete', 'patch'];
  return Object.values(apiPaths).every((methodsObj) => {
    const methodKeys = Object.keys(methodsObj).map((method) => method.toLowerCase());
    const hasAtLeastTwoMethods = methodKeys.length >= 2;
    const hasValidHttpMethod = methodKeys.some((method) => validHttpMethods.includes(method));
    return hasAtLeastTwoMethods && hasValidHttpMethod;
  });
};
