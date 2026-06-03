// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

export class ApiInfo {
  // Properties based on the OpenAPI specification
  apiName: string;
  apiVersion: string;
  apiReleased: string;
  apiDocumentation: string;
  apiStatus: string;

  constructor(
    apiName: string,
    apiVersion: string,
    apiReleased: string,
    apiDocumentation: string,
    apiStatus: string,
  ) {
    this.apiName = apiName;
    this.apiVersion = apiVersion;
    this.apiReleased = apiReleased;
    this.apiDocumentation = apiDocumentation;
    this.apiStatus = apiStatus;
  }
}
