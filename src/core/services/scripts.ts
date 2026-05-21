import type { RequestOptions, RequestScripts, ResponseState } from '../types';
import type { GraphQLRequestOptions } from './graphql-client';
import type { ScriptAssertionResult, ScriptExecutionResult } from '../types';

type ScriptRequestContext = RequestOptions | GraphQLRequestOptions;

type MutableScriptRequest = Record<string, unknown> & {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  query?: string;
  variables?: string;
  operationName?: string;
};

interface ScriptRuntimeContext {
  request: MutableScriptRequest;
  response?: ScriptResponseContext;
  env: Record<string, string>;
  test: (name: string, fn: () => void | Promise<void>) => Promise<void>;
  expect: (actual: unknown) => ScriptExpectation;
  console: {
    log: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
  };
}

interface ScriptResponseContext {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
  json: () => unknown;
}

interface ScriptExpectation {
  toBe(expected: unknown): void;
  toEqual(expected: unknown): void;
  toContain(expected: unknown): void;
  toBeTruthy(): void;
  toBeFalsy(): void;
}

export interface BeforeScriptExecution<TRequest extends ScriptRequestContext> {
  request: TRequest;
  result?: ScriptExecutionResult;
}

function hasText(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function stringifyOutput(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function assertDeepEqual(actual: unknown, expected: unknown): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${stringifyOutput(actual)} to equal ${stringifyOutput(expected)}`);
  }
}

function createExpect(actual: unknown): ScriptExpectation {
  return {
    toBe(expected: unknown) {
      if (!Object.is(actual, expected)) {
        throw new Error(`Expected ${stringifyOutput(actual)} to be ${stringifyOutput(expected)}`);
      }
    },
    toEqual(expected: unknown) {
      assertDeepEqual(actual, expected);
    },
    toContain(expected: unknown) {
      if (typeof actual === 'string') {
        if (!actual.includes(String(expected))) {
          throw new Error(`Expected ${actual} to contain ${String(expected)}`);
        }
        return;
      }

      if (Array.isArray(actual)) {
        if (!actual.includes(expected)) {
          throw new Error(`Expected array to contain ${stringifyOutput(expected)}`);
        }
        return;
      }

      throw new Error('Expected value to support contain assertion');
    },
    toBeTruthy() {
      if (!actual) throw new Error(`Expected ${stringifyOutput(actual)} to be truthy`);
    },
    toBeFalsy() {
      if (actual) throw new Error(`Expected ${stringifyOutput(actual)} to be falsy`);
    },
  };
}

function createRequestContext<TRequest extends ScriptRequestContext>(
  request: TRequest,
): MutableScriptRequest {
  const base: MutableScriptRequest = {
    url: request.url,
    headers: { ...(request.headers ?? {}) },
  };

  if ('method' in request && request.method) base.method = request.method;
  if ('body' in request && typeof request.body === 'string') base.body = request.body;
  if ('query' in request) base.query = request.query;
  if ('variables' in request) base.variables = request.variables;
  if ('operationName' in request) base.operationName = request.operationName;

  return base;
}

function applyRequestContext<TRequest extends ScriptRequestContext>(
  original: TRequest,
  context: MutableScriptRequest,
): TRequest {
  const updates: Partial<RequestOptions & GraphQLRequestOptions> = {
    url: typeof context.url === 'string' ? context.url : original.url,
    headers: context.headers ? { ...context.headers } : original.headers,
  };

  if ('method' in original && typeof context.method === 'string') {
    updates.method = context.method;
  }
  if ('body' in original && typeof context.body === 'string') {
    updates.body = context.body;
  }
  if ('query' in original && typeof context.query === 'string') {
    updates.query = context.query;
  }
  if ('variables' in original && typeof context.variables === 'string') {
    updates.variables = context.variables;
  }
  if ('operationName' in original && typeof context.operationName === 'string') {
    updates.operationName = context.operationName;
  }

  return { ...original, ...updates } as TRequest;
}

function createResponseContext(response: ResponseState): ScriptResponseContext {
  return {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    body: response.body,
    time: response.time,
    json: () => JSON.parse(response.body),
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export class ScriptService {
  hasScripts(scripts?: RequestScripts): boolean {
    return hasText(scripts?.beforeRequest) || hasText(scripts?.afterResponse);
  }

  async runBeforeRequest<TRequest extends ScriptRequestContext>(
    request: TRequest,
  ): Promise<BeforeScriptExecution<TRequest>> {
    const script = request.scripts?.beforeRequest;
    if (!hasText(script)) {
      return { request };
    }

    const mutableRequest = createRequestContext(request);
    const result = await this.runScript(script, mutableRequest);
    return {
      request: result.success ? applyRequestContext(request, mutableRequest) : request,
      result,
    };
  }

  async runAfterResponse(
    request: ScriptRequestContext,
    response: ResponseState,
  ): Promise<ScriptExecutionResult | undefined> {
    const script = request.scripts?.afterResponse;
    if (!hasText(script)) {
      return undefined;
    }

    return this.runScript(script, createRequestContext(request), createResponseContext(response));
  }

  private async runScript(
    source: string,
    request: MutableScriptRequest,
    response?: ScriptResponseContext,
  ): Promise<ScriptExecutionResult> {
    const output: string[] = [];
    const assertions: ScriptAssertionResult[] = [];

    const test = async (name: string, fn: () => void | Promise<void>): Promise<void> => {
      try {
        await fn();
        assertions.push({ name, passed: true });
      } catch (error) {
        assertions.push({ name, passed: false, message: getErrorMessage(error) });
      }
    };

    const context: ScriptRuntimeContext = {
      request,
      response,
      env: {},
      test,
      expect: createExpect,
      console: {
        log: (...args) => output.push(args.map(stringifyOutput).join(' ')),
        warn: (...args) => output.push(args.map(stringifyOutput).join(' ')),
        error: (...args) => output.push(args.map(stringifyOutput).join(' ')),
      },
    };

    try {
      const fn = new Function(
        'context',
        `const { request, response, env, test, expect, console } = context; return (async () => {\n${source}\n})();`,
      ) as (context: ScriptRuntimeContext) => Promise<unknown>;
      await fn(context);
      const failedAssertion = assertions.find((assertion) => !assertion.passed);
      return {
        success: !failedAssertion,
        output,
        assertions,
        error: failedAssertion?.message,
      };
    } catch (error) {
      return {
        success: false,
        output,
        assertions,
        error: getErrorMessage(error),
      };
    }
  }
}
