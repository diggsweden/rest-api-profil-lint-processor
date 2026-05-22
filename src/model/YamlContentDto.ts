// SPDX-FileCopyrightText: 2025 Digg - Agency for Digital Government
//
// SPDX-License-Identifier: EUPL-1.2

// Define the YamlContent class
export class YamlContentDto {
  // Properties
  yaml: string;
  categories: string[];

  // Constructor to initialize the object
  constructor(yaml: string, categories: string[]) {
    this.yaml = yaml;
    this.categories = categories;
  }
}
