import { type Request, type Response, type NextFunction } from "express";

type Handler = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

export function wrap(fn: Handler): Handler {
  return (req, res, next) => {
    let responded = false;
    // Track if response was already sent
    const wrappedNext = (err?: unknown) => {
      if (responded) return;
      responded = true;
      if (err) next(err instanceof Error ? err : new Error(String(err)));
      else next();
    };
    try {
      const result = fn(req, res, wrappedNext);
      if (result instanceof Promise) {
        result.catch((err) => {
          if (!responded) { responded = true; next(err instanceof Error ? err : new Error(String(err))); }
        });
      }
    } catch (err) {
      if (!responded) { responded = true; next(err instanceof Error ? err : new Error(String(err))); }
    }
  };
}
