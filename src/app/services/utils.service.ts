import { pipe, tap } from 'rxjs';

export class UtilsService {

  constructor() { }

  static logErrorAndCompleteToConsole<T>(identifier: string) {
    return pipe(
      UtilsService.logErrorToConsole<T>(identifier),
      tap<T>({
        complete: () => console.error(`[${identifier}] completed - but shouldn't!`),
      })
    );
  }

  static logErrorToConsole<T>(identifier: string) {
    return pipe(
      tap<T>({
        error: (err) =>
          console.error(`[${identifier}] generated error: ` + UtilsService.safeStringify(err)),
      })
    );
  }

  /**
   * Failsafe JSON.stringify
   * @param value Object to stringify
   * @param fallback Text return if value cannot be serialized
   * @returns
   */
  public static safeStringify(
    value: unknown,
    fallback = 'Cannot serialize'
  ): string {
    try {
      return JSON.stringify(value, null, 4);
    } catch (e) {
      return fallback;
    }
  }

  /**
   * Typesafe filterering to be used in RxJs pipes
   * https://stackoverflow.com/a/46700791
   * @param value
   * @returns false if null or undefined, or else true
   */
  public static notEmpty<TValue>(
    value: TValue | null | undefined
  ): value is TValue {
    if (value === null || value === undefined) return false;
    return true;
  }
}
