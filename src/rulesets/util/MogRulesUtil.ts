// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2
import { isObject } from '../../util/typeUtil.js';

export const validHttpMethods = ['get', 'post', 'put', 'delete', 'patch'];

export const countEndpoints = (apiPaths: Record<string, any>): number => {
  if (!isObject(apiPaths)) return 0;
  const normalized = new Set(
    Object.keys(apiPaths).map(
      (path) =>
        '/' +
        path
          .split('/')
          .filter((seg) => seg !== '' && !seg.startsWith('{'))
          .join('/'),
    ),
  );
  return normalized.size;
};

export const countDistinctHttpMethods = (apiPaths: Record<string, any>): number => {
  if (!isObject(apiPaths)) return 0;
  const methods = new Set<string>();
  Object.values(apiPaths).forEach((methodsObj) => {
    // Empty path (null) if incorrect indentation
    if (!isObject(methodsObj)) return;
    Object.keys(methodsObj)
      .filter((m) => validHttpMethods.includes(m.toLowerCase()))
      .forEach((m) => methods.add(m.toLowerCase()));
  });
  return methods.size;
};

export const eachPathHasValidRestOperation = (apiPaths: Record<string, any>): boolean => {
  if (!isObject(apiPaths)) return false;
  return Object.values(apiPaths).every(
    (methodsObj) =>
      // A path that is not an object has no valid operation
      isObject(methodsObj) && Object.keys(methodsObj).some((m) => validHttpMethods.includes(m.toLowerCase())),
  );
};

const allHttpMethods = ['get', 'post', 'put', 'delete', 'options', 'head', 'patch', 'trace'];

const hasLinksInSchema = (schema: any): boolean => {
  if (!schema || typeof schema !== 'object') return false;

  if (schema.properties?._links) return true;

  if (schema.properties?.href && (schema.properties?.rel || schema.properties?.method)) return true;

  for (const key of ['allOf', 'anyOf', 'oneOf']) {
    if (Array.isArray(schema[key]) && schema[key].some(hasLinksInSchema)) return true;
  }

  if (schema.items) return hasLinksInSchema(schema.items);

  if (schema.properties) {
    return Object.values(schema.properties).some((prop: any) => hasLinksInSchema(prop));
  }

  return false;
};

export const hasHateoasIndicators = (apiPaths: Record<string, any>): boolean => {
  if (!isObject(apiPaths)) return false;
  return Object.values(apiPaths).some((pathItem) => {
    if (!isObject(pathItem)) return false;
    return Object.entries(pathItem)
      .filter(([key]) => allHttpMethods.includes(key.toLowerCase()))
      .some(([, operation]: [string, any]) => {
        if (!isObject(operation?.responses)) return false;
        return Object.values(operation.responses).some((response: any) => {
          if (!isObject(response)) return false;
          if (isObject(response.links) && Object.keys(response.links).length > 0) return true;
          // content must be an object of media types (e.g. not a string)
          if (!isObject(response.content)) return false;
          if ('application/hal+json' in response.content) return true;
          return Object.values(response.content).some((mediaType: any) => hasLinksInSchema(mediaType?.schema));
        });
      });
  });
};
