import type { Response } from 'supertest';

/**
 * Contract rules from docs/openapi (components/schemas/Error.yaml and
 * components/responses/*.yaml). Centralised here so no spec repeats them.
 */

function expectJson(res: Response): void {
  expect(res.headers['content-type']).toMatch(/application\/json/);
}

/** Single resource: checks status + JSON and returns the body. */
export function expectData(res: Response, status: number): any {
  expect(res.status).toBe(status);
  expectJson(res);
  expect(res.body).not.toBeNull();
  expect(Array.isArray(res.body)).toBe(false);
  return res.body;
}

/** List endpoints: the contract returns a plain JSON array (200). */
export function expectList(res: Response): any[] {
  expect(res.status).toBe(200);
  expectJson(res);
  expect(Array.isArray(res.body)).toBe(true);
  return res.body;
}

/**
 * Error body: { statusCode, error, message, path, timestamp, details? }.
 * `errorName` is the short stable name ("Not Found", "Conflict"...).
 * With `detailFields`, 400 responses must report each of those fields in
 * `details[].field`.
 */
export function expectError(res: Response, status: number, errorName: string, detailFields?: string[]): void {
  expect(res.status).toBe(status);
  expectJson(res);
  expect(res.body).toMatchObject({
    statusCode: status,
    error: errorName,
    message: expect.anything(),
    path: expect.any(String),
    timestamp: expect.any(String),
  });
  expect(Number.isNaN(Date.parse(res.body.timestamp))).toBe(false);

  if (detailFields) {
    expect(Array.isArray(res.body.details)).toBe(true);
    const fields = res.body.details.map((d: { field: string }) => d.field);
    expect(fields).toEqual(expect.arrayContaining(detailFields));
    for (const detail of res.body.details) {
      expect(detail).toMatchObject({ field: expect.any(String), message: expect.any(String) });
    }
  }
}

/** 204 with no body. */
export function expectNoContent(res: Response): void {
  expect(res.status).toBe(204);
  expect(res.text === '' || res.text === undefined).toBe(true);
}
