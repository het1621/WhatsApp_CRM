import { PhoneNormalizer } from '../src/lib/phoneNormalizer';

describe('PhoneNormalizer', () => {
  let normalizer: PhoneNormalizer;

  beforeEach(() => {
    normalizer = new PhoneNormalizer('IN');
  });

  it('should normalize a standard 10-digit Indian number', () => {
    const result = normalizer.normalizeSingle('9876543210');
    expect(result.valid).toBe(true);
    expect(result.e164).toBe('+919876543210');
  });

  it('should handle numbers with spaces and country codes', () => {
    const result = normalizer.normalizeSingle('+91 98765 43210');
    expect(result.valid).toBe(true);
    expect(result.e164).toBe('+919876543210');
  });

  it('should reject invalid numbers', () => {
    const result = normalizer.normalizeSingle('12345');
    expect(result.valid).toBe(false);
  });
});
