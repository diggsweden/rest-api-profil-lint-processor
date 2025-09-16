// SPDX-FileCopyrightText: 2025 diggsweden/rest-api-profil-lint-processor
//
// SPDX-License-Identifier: EUPL-1.2

import { isValidApplicationJson } from '../../src/rulesets/util/AmeRulesUtil';

describe('ameRulesUtil', () => {
  describe('isValidApplicationJson', () => {
    it('Should allow plain application/json', () => {
      expect(isValidApplicationJson('application/json')).toBe(true);
    });
    it('Should allow utf-8 charset', () => {
      expect(isValidApplicationJson('application/json; charset=utf-8')).toBe(true);
    });
    it('Should allow custom charset', () => {
      expect(isValidApplicationJson('application/json; charset=latin-1')).toBe(true);
    });
    it('Should ignore whitespace', () => {
      expect(isValidApplicationJson('application/json;charset=utf-8')).toBe(true);
    });
    it('Should not allow custom additional property', () => {
      expect(isValidApplicationJson('application/json; invalidProp=utf-8')).toBe(false);
    });
    it('Should not allow other mimetype', () => {
      expect(isValidApplicationJson('application/xml')).toBe(false);
    });
  });
});
