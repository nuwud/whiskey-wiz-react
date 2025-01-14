import { ErrorHandler, logError } from '../utils/errorHandler';

describe('ErrorHandler', () => {
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

  afterEach(() => {
    consoleErrorSpy.mockClear();
    consoleLogSpy.mockClear();
  });

  it('should log errors with default options', () => {
    const testError = new Error('Test Error');
    logError(testError);

    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should handle async errors safely', async () => {
    const asyncFn = async () => {
      throw new Error('Async Error');
    };

    const result = await ErrorHandler.safeAsync(asyncFn);

    expect(result).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
