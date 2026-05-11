import { test, expect, describe, mock } from 'bun:test';
import { detectCurl, detectProtocol, parseCurl, buildCurl, copyCurl } from './curlUtility';

describe('detectCurl', () => {
  test('detects simple curl command', () => {
    expect(detectCurl('curl https://example.com')).toBe(true);
  });

  test('detects curl.exe', () => {
    expect(detectCurl('curl.exe -X GET https://example.com')).toBe(true);
  });

  test('detects curl with uppercase', () => {
    expect(detectCurl('CURL https://example.com')).toBe(true);
  });

  test('rejects non-curl input', () => {
    expect(detectCurl('wget https://example.com')).toBe(false);
  });

  test('rejects empty string', () => {
    expect(detectCurl('')).toBe(false);
  });

  test('rejects whitespace only', () => {
    expect(detectCurl('   ')).toBe(false);
  });

  test('detects curl inside markdown code block', () => {
    const input = '```bash\ncurl https://example.com\n```';
    expect(detectCurl(input)).toBe(true);
  });

  test('detects curl with shell prompt', () => {
    expect(detectCurl('$ curl https://example.com')).toBe(true);
  });

  test('detects curl with angle prompt', () => {
    expect(detectCurl('> curl https://example.com')).toBe(true);
  });
});

describe('detectProtocol', () => {
  test('detects REST by default', () => {
    expect(detectProtocol('curl https://api.example.com/users')).toBe('rest');
  });

  test('detects GraphQL by URL path', () => {
    expect(detectProtocol('curl https://api.example.com/graphql')).toBe('graphql');
  });

  test('detects GraphQL by URL with graphql in path', () => {
    expect(detectProtocol('curl https://api.example.com/v1/graphql/endpoint')).toBe('graphql');
  });

  test('detects GraphQL by body containing query field', () => {
    const curl = 'curl -X POST https://api.example.com -d \'{"query":"{ users { name } }"}\'';
    expect(detectProtocol(curl)).toBe('graphql');
  });

  test('detects REST when body is non-graphql JSON', () => {
    const curl = 'curl -X POST https://api.example.com -d \'{"name":"John"}\'';
    expect(detectProtocol(curl)).toBe('rest');
  });
});

describe('parseCurl', () => {
  test('parses simple GET request', () => {
    const result = parseCurl('curl https://example.com/api/users');
    expect(result.protocol).toBe('rest');
    expect(result.method).toBe('GET');
    expect(result.url).toBe('https://example.com/api/users');
    expect(result.headers).toEqual({});
    expect(result.body).toBe('');
  });

  test('parses GET with explicit method', () => {
    const result = parseCurl('curl -X GET https://example.com/api');
    expect(result.method).toBe('GET');
    expect(result.url).toBe('https://example.com/api');
  });

  test('parses POST request', () => {
    const result = parseCurl(
      'curl -X POST https://example.com/api -H \'Content-Type: application/json\' -d \'{"key":"value"}\'',
    );
    expect(result.method).toBe('POST');
    expect(result.url).toBe('https://example.com/api');
    expect(result.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(result.body).toBe('{"key":"value"}');
  });

  test('parses PUT request', () => {
    const result = parseCurl(
      "curl -X PUT https://example.com/api/1 -H 'Authorization: Bearer token123'",
    );
    expect(result.method).toBe('PUT');
    expect(result.headers).toEqual({ Authorization: 'Bearer token123' });
  });

  test('parses DELETE request', () => {
    const result = parseCurl('curl -X DELETE https://example.com/api/1 -H "Accept: */*"');
    expect(result.method).toBe('DELETE');
    expect(result.headers).toEqual({ Accept: '*/*' });
  });

  test('defaults method to POST when body is present', () => {
    const result = parseCurl('curl https://example.com/api -d \'{"name":"test"}\'');
    expect(result.method).toBe('POST');
    expect(result.body).toBe('{"name":"test"}');
  });

  test('defaults method to GET when no body', () => {
    const result = parseCurl('curl https://example.com/api');
    expect(result.method).toBe('GET');
  });

  test('parses multiple headers', () => {
    const result = parseCurl(
      "curl -H 'Content-Type: application/json' -H 'Authorization: Bearer abc' -H 'X-Custom: value' https://example.com",
    );
    expect(result.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer abc',
      'X-Custom': 'value',
    });
  });

  test('parses GraphQL request from URL path', () => {
    const result = parseCurl(
      'curl -X POST https://example.com/graphql -H \'Content-Type: application/json\' -d \'{"query":"{ users { name } }"}\'',
    );
    expect(result.protocol).toBe('graphql');
    expect(result.method).toBe('POST');
    expect(result.url).toBe('https://example.com/graphql');
    expect(result.query).toBe('{ users { name } }');
  });

  test('parses GraphQL request with variables', () => {
    const result = parseCurl(
      'curl -X POST https://example.com/api -d \'{"query":"query ($limit: Int!) { users(limit: $limit) { name } }","variables":{"limit":10}}\'',
    );
    expect(result.protocol).toBe('graphql');
    expect(result.query).toBe('query ($limit: Int!) { users(limit: $limit) { name } }');
    expect(result.variables).toBe('{"limit":10}');
  });

  test('parses curl with --request long flag', () => {
    const result = parseCurl('curl --request PATCH https://example.com/api');
    expect(result.method).toBe('PATCH');
  });

  test('parses curl with --header long flag', () => {
    const result = parseCurl('curl --header "X-Test: value" https://example.com');
    expect(result.headers).toEqual({ 'X-Test': 'value' });
  });

  test('parses curl with --data long flag', () => {
    const result = parseCurl('curl --data \'{"hello":"world"}\' https://example.com/api');
    expect(result.body).toBe('{"hello":"world"}');
  });

  test('parses curl with --data-raw flag', () => {
    const result = parseCurl('curl --data-raw \'{"hello":"world"}\' https://example.com/api');
    expect(result.body).toBe('{"hello":"world"}');
  });

  test('parses curl with --data-binary flag', () => {
    const result = parseCurl("curl --data-binary 'raw content' https://example.com/api");
    expect(result.body).toBe('raw content');
  });

  test('parses multiline curl with backslash continuations', () => {
    const input = `curl -X POST \\
  https://example.com/api \\
  -H 'Content-Type: application/json' \\
  -H 'Accept: application/json' \\
  -d '{"key":"value"}'`;
    const result = parseCurl(input);
    expect(result.method).toBe('POST');
    expect(result.url).toBe('https://example.com/api');
    expect(result.headers).toEqual({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
    expect(result.body).toBe('{"key":"value"}');
  });

  test('parses Chrome-style DevTools curl', () => {
    const input = `curl 'https://example.com/api/users' \\
  -H 'accept: application/json, text/plain, */*' \\
  -H 'content-type: application/json' \\
  --data-raw '{"name":"John"}' \\
  --compressed`;
    const result = parseCurl(input);
    expect(result.method).toBe('POST');
    expect(result.url).toBe('https://example.com/api/users');
    expect(result.headers).toEqual({
      accept: 'application/json, text/plain, */*',
      'content-type': 'application/json',
    });
    expect(result.body).toBe('{"name":"John"}');
  });

  test('skips common flags like --compressed, -k, -s, -v, -L', () => {
    const result = parseCurl('curl -s -k -v -L --compressed https://example.com/api');
    expect(result.method).toBe('GET');
    expect(result.url).toBe('https://example.com/api');
  });

  test('parses curl with --url flag', () => {
    const result = parseCurl("curl -X GET --url 'https://example.com/api'");
    expect(result.url).toBe('https://example.com/api');
  });

  test('throws on non-curl input', () => {
    expect(() => parseCurl('some random text')).toThrow('Not a valid curl command');
  });

  test('throws on empty string', () => {
    expect(() => parseCurl('')).toThrow('Not a valid curl command');
  });
});

describe('buildCurl', () => {
  test('builds simple GET curl', () => {
    const result = buildCurl({
      protocol: 'rest',
      method: 'GET',
      url: 'https://example.com/api',
    });
    expect(result).toContain('curl');
    expect(result).toContain('-X GET');
    expect(result).toContain("'https://example.com/api'");
  });

  test('builds POST curl with body', () => {
    const result = buildCurl({
      protocol: 'rest',
      method: 'POST',
      url: 'https://example.com/api',
      body: '{"key":"value"}',
    });
    expect(result).toContain('-X POST');
    expect(result).toContain('-d');
    expect(result).toContain('{"key":"value"}');
  });

  test('builds curl with headers', () => {
    const result = buildCurl({
      protocol: 'rest',
      method: 'GET',
      url: 'https://example.com/api',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer abc',
      },
    });
    expect(result).toContain("-H 'Content-Type: application/json'");
    expect(result).toContain("-H 'Authorization: Bearer abc'");
  });

  test('builds curl with body containing single quotes using double quotes', () => {
    const result = buildCurl({
      protocol: 'rest',
      method: 'POST',
      url: 'https://example.com/api',
      body: '{"name":"O\'Brien"}',
    });
    expect(result).toContain('-d');
    expect(result).toContain('{');
  });

  test('builds GraphQL curl', () => {
    const result = buildCurl({
      protocol: 'graphql',
      method: 'POST',
      url: 'https://example.com/graphql',
      query: '{ users { name } }',
    });
    expect(result).toContain('-X POST');
    expect(result).toContain("'https://example.com/graphql'");
    expect(result).toContain('-H');
    expect(result).toContain('Content-Type: application/json');
    expect(result).toContain('-d');
  });

  test('builds GraphQL curl with variables', () => {
    const result = buildCurl({
      protocol: 'graphql',
      method: 'POST',
      url: 'https://example.com/graphql',
      query: 'query { users { name } }',
      variables: '{"limit":10}',
    });
    expect(result).toContain('-d');
    expect(result).toContain('"query"');
    expect(result).toContain('"variables"');
  });

  test('builds PATCH curl', () => {
    const result = buildCurl({
      protocol: 'rest',
      method: 'PATCH',
      url: 'https://example.com/api/1',
      body: '{"updated":true}',
    });
    expect(result).toContain('-X PATCH');
  });
});

describe('copyCurl', () => {
  test('returns a boolean result for REST', async () => {
    const result = await copyCurl({
      protocol: 'rest',
      method: 'GET',
      url: 'https://example.com',
    });
    expect(typeof result).toBe('boolean');
  });

  test('returns a boolean result for GraphQL', async () => {
    const result = await copyCurl({
      protocol: 'graphql',
      method: 'POST',
      url: 'https://example.com/graphql',
      query: '{ users { name } }',
    });
    expect(typeof result).toBe('boolean');
  });
});
