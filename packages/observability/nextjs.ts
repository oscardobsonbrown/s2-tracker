import { scrubLogPayload } from "./scrub";

export interface RequestLogger {
  emit: () => void;
  get: () => Record<string, unknown>;
  set: (payload: Record<string, unknown>) => void;
}

export interface EvlogContext {
  log: RequestLogger;
  requestId: string;
}

const createRequestLogger = (): RequestLogger => {
  const context: Record<string, unknown> = {};

  return {
    emit: () => null,
    get: () => context,
    set: (payload) => {
      Object.assign(context, scrubLogPayload(payload));
    },
  };
};

export const createError = (input: {
  status: number;
  message: string;
  why?: string;
  fix?: string;
}) => {
  const error = new Error(input.message) as Error & {
    fix?: string;
    status?: number;
    why?: string;
  };

  error.status = input.status;
  error.why = input.why;
  error.fix = input.fix;

  return error;
};

export const useLogger = () => createRequestLogger();

export const withEvlog =
  (
    handler: (req: Request, ctx: EvlogContext) => Promise<Response> | Response
  ) =>
  async (req: Request) => {
    const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
    const log = createRequestLogger();

    log.set({
      request: {
        method: req.method,
        path: new URL(req.url).pathname,
      },
    });

    try {
      const response = await handler(req, { log, requestId });
      log.set({ response: { status: response.status } });
      log.emit();
      return response;
    } catch (error) {
      log.set({
        error: error instanceof Error ? error.message : String(error),
      });
      log.emit();
      throw error;
    }
  };
