import schema from './catalog-response-schema.json';
import type { ElearningCatalogResponse } from './elearning-api';

type Shape = { type?: string; properties?: Record<string, Shape>; required?: string[]; items?: Shape; anyOf?: Shape[]; enum?: unknown[]; minimum?: number; maximum?: number; format?: string };
export class InvalidCatalogResponseError extends Error {
  constructor() { super('Les données des formations reçues sont incohérentes. Réessayez.'); }
}
const invalid = (): never => { throw new InvalidCatalogResponseError(); };

/** A bounded projection of the published catalog schema, shared by SSR and browser reads.
 * Unknown keys never cross the rendering boundary, including nested course data. */
function project(value: unknown, shape: Shape): unknown {
  if (shape.anyOf) {
    for (const candidate of shape.anyOf) {
      try { return project(value, candidate); } catch (error) { if (!(error instanceof InvalidCatalogResponseError)) throw error; }
    }
    return invalid();
  }
  if (shape.type === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
    const record = value as Record<string, unknown>;
    if (shape.required?.some(key => record[key] === undefined)) return invalid();
    return Object.fromEntries(Object.entries(shape.properties ?? {}).filter(([key]) => record[key] !== undefined)
      .map(([key, field]) => [key, project(record[key], field)]));
  }
  if (shape.type === 'array') return Array.isArray(value) && shape.items ? value.map(item => project(item, shape.items!)) : invalid();
  if (shape.type === 'null') return value === null ? null : invalid();
  if (shape.type === 'integer' ? !Number.isInteger(value) : typeof value !== shape.type) return invalid();
  if (shape.enum && !shape.enum.includes(value)) return invalid();
  if (typeof value === 'number' && (!Number.isFinite(value) || shape.minimum !== undefined && value < shape.minimum || shape.maximum !== undefined && value > shape.maximum)) return invalid();
  if (typeof value === 'string' && shape.format === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return invalid();
  if (typeof value === 'string' && shape.format === 'uri') { try { new URL(value); } catch { return invalid(); } }
  return value;
}

export function parseCatalogResponse(value: unknown): ElearningCatalogResponse {
  return project(value, schema as Shape) as ElearningCatalogResponse;
}
export type InitialCatalog = { data: ElearningCatalogResponse | null; error: string | null; status: number };
