import { expect } from 'chai';
import noop from 'lodash/noop';

import {
  buildRegExpFromDelimiters,
  canDrag,
  canDrop,
} from '../src/components/utils';

const KeyCodes = {
  colon: 58,
  forwardSlash: 47,
  period: 46,
};

/**
 * Tests that the generated regex works as expected
 * @param {string} input Input string to be split
 * @param {array<char>} delimiters Array of characters to build a regex for
 * @param {array<string>} expected resulting split of the input
 */
function testRegex(input, delimiters, expected) {
  const regex = buildRegExpFromDelimiters(delimiters);
  const result = input.split(regex);
  expect(result).to.deep.equal(expected);
}

describe('Test buildRegExpFromDelimiters', () => {
  test('handles / delimiter', () => {
    const input = 'https:/www.lodash.com';
    const delimiters = [KeyCodes.forwardSlash];
    const expected = ['https:', 'www.lodash.com'];
    testRegex(input, delimiters, expected);
  });

  test('handles multiple consecutive delimiters', () => {
    const input = 'https:///www.lodash.com';
    const delimiters = [KeyCodes.forwardSlash];
    const expected = ['https:', 'www.lodash.com'];
    testRegex(input, delimiters, expected);
  });

  test('handles multiple delimiters', () => {
    const input = 'https://www.lodash.com';
    const delimiters = [KeyCodes.colon, KeyCodes.forwardSlash, KeyCodes.period];
    const expected = ['https', 'www', 'lodash', 'com'];
    testRegex(input, delimiters, expected);
  });
});

describe('Test canDrag', () => {
  const input = { readOnly: false, allowDragDrop: true, moveTag: noop };
  test('should return false when readOnly set to true', () => {
    const result = canDrag({ ...input, readOnly: true });
    expect(result).to.equal(false);
  });

  test('should return false when allowDragDrop set to false', () => {
    const result = canDrag({ ...input, allowDragDrop: false });
    expect(result).to.equal(false);
  });

  test('should return false when moveTag set to undefined', () => {
    const result = canDrag({ ...input, moveTag: undefined });
    expect(result).to.equal(false);
  });

  test('should return true when all params are truthy for canDrag', () => {
    const result = canDrag(input);
    expect(result).to.equal(true);
  });
});

describe('Test canDrop', () => {
  const input = { readOnly: false, allowDragDrop: true };
  test('should return false when readOnly set to true', () => {
    const result = canDrop({ ...input, readOnly: true });
    expect(result).to.equal(false);
  });

  test('should return false when allowDragDrop set to false', () => {
    const result = canDrop({ ...input, allowDragDrop: false });
    expect(result).to.equal(false);
  });

  test('should return true when all params are truthy for canDrop', () => {
    const result = canDrop(input);
    expect(result).to.equal(true);
  });
});
