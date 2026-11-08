import { isMemberLookupPending } from './memberLookup';

describe('isMemberLookupPending', () => {
  it('is false when no usable number is typed', () => {
    expect(isMemberLookupPending('', '')).toBe(false);
    expect(isMemberLookupPending('   ', '')).toBe(false);
    expect(isMemberLookupPending('07712', '')).toBe(false);
  });

  it('is true from the moment a usable number is typed until its lookup finishes', () => {
    expect(isMemberLookupPending('0771234567', '')).toBe(true);
    expect(isMemberLookupPending('0771234567', '077123456')).toBe(true);
  });

  it('is false once the lookup for that exact number has finished, whatever the result', () => {
    expect(isMemberLookupPending('0771234567', '0771234567')).toBe(false);
    expect(isMemberLookupPending(' 0771234567 ', '0771234567')).toBe(false);
  });

  it('becomes pending again when the number is edited', () => {
    expect(isMemberLookupPending('07712345678', '0771234567')).toBe(true);
  });
});
