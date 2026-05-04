// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

export const validHttpMethods = ['get', 'post', 'put', 'delete', 'patch'];

export const countEndpoints = (apiPaths: Record<string, any>): number => {
  return Object.keys(apiPaths).length;
};

export const countTotalHttpMethods = (apiPaths: Record<string, any>): number => {
  return Object.values(apiPaths).reduce((total: number, methodsObj) => {
    return total + Object.keys(methodsObj).filter((m) => validHttpMethods.includes(m.toLowerCase())).length;
  }, 0);
};

export const eachPathHasValidRestOperation = (apiPaths: Record<string, any>): boolean => {
  return Object.values(apiPaths).every((methodsObj) =>
    Object.keys(methodsObj).some((m) => validHttpMethods.includes(m.toLowerCase())),
  );
};

const allHttpMethods = ['get', 'post', 'put', 'delete', 'options', 'head', 'patch', 'trace'];

const hasLinksInSchema = (schema: any): boolean => {
  if (!schema || typeof schema !== 'object') return false;
  if (schema.properties?._links) return true;
  for (const key of ['allOf', 'anyOf', 'oneOf']) {
    if (Array.isArray(schema[key]) && schema[key].some(hasLinksInSchema)) return true;
  }
  if (schema.items) return hasLinksInSchema(schema.items);
  return false;
};

export const hasHateoasIndicators = (apiPaths: Record<string, any>): boolean => {
  return Object.values(apiPaths).some((pathItem) => {
    if (typeof pathItem !== 'object') return false;
    return Object.entries(pathItem)
      .filter(([key]) => allHttpMethods.includes(key.toLowerCase()))
      .some(([, operation]: [string, any]) => {
        if (!operation?.responses) return false;
        return Object.values(operation.responses).some((response: any) => {
          if (typeof response !== 'object') return false;
          if (response.links && Object.keys(response.links).length > 0) return true;
          if (!response.content) return false;
          if ('application/hal+json' in response.content) return true;
          return Object.values(response.content).some((mediaType: any) =>
            hasLinksInSchema(mediaType?.schema),
          );
        });
      });
  });
};

export const endPointsAreValid = (apiPaths: Record<string, any>): boolean => {
  return Object.values(apiPaths).every((methodsObj) => {
    const methodKeys = Object.keys(methodsObj).map((method) => method.toLowerCase());
    const hasAtLeastTwoMethods = methodKeys.length >= 2;
    const hasValidHttpMethod = methodKeys.some((method) => validHttpMethods.includes(method));
    return hasAtLeastTwoMethods && hasValidHttpMethod;
  });
};
