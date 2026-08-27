import { RelativeTimePipe } from './relative-time.pipe';

describe('RelativeTimePipe', () => {
  let pipe: RelativeTimePipe;

  beforeEach(() => {
    pipe = new RelativeTimePipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string for null or undefined', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should format recent dates as Just now or minutes ago', () => {
    const nowIso = new Date().toISOString();
    expect(pipe.transform(nowIso)).toBe('Just now');

    const twoMinutesAgoIso = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    expect(pipe.transform(twoMinutesAgoIso)).toBe('2m ago');

    const threeHoursAgoIso = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
    expect(pipe.transform(threeHoursAgoIso)).toBe('3h ago');
  });
});
