import { EgpCurrencyPipe } from './egyptian-currency.pipe';

describe('EgpCurrencyPipe', () => {
  let pipe: EgpCurrencyPipe;

  beforeEach(() => {
    pipe = new EgpCurrencyPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should format numbers into EGP currency strings', () => {
    expect(pipe.transform(150)).toBe('150.00 EGP');
    expect(pipe.transform(1250.5)).toBe('1,250.50 EGP');
    expect(pipe.transform(0)).toBe('0.00 EGP');
  });

  it('should handle null or undefined gracefully', () => {
    expect(pipe.transform(null)).toBe('0.00 EGP');
    expect(pipe.transform(undefined)).toBe('0.00 EGP');
  });
});
