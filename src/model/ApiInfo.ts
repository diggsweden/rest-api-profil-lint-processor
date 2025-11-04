// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

export class ApiInfo {
  // Properties based on the OpenAPI specification
  apiName: string;
  apiVersion: string;
  apiReleased: Date; // Date type for "apiReleased"
  apiDocumentation: string; // Assuming a URI is represented as a string
  apiStatus: string;

  // Constructor to initialize the class with values
  constructor(
    apiName: string,
    apiVersion: string,
    apiReleased: string | Date, // Accepting both string and Date for flexibility
    apiDocumentation: string,
    apiStatus: string,
  ) {
    this.apiName = apiName;
    this.apiVersion = apiVersion;
    this.apiReleased = new Date(apiReleased); // Convert string to Date
    this.apiDocumentation = apiDocumentation;
    this.apiStatus = apiStatus;
  }
}
