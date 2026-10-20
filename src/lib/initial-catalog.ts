import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { isExpiredJwt, publicOrigin } from '@mairie360/lib-components/shared';
import { BffRequestError, createElearningClient, type requestBff } from './bff-client';
import { configuredBffUrl, forwardToBff } from './bff-proxy';
import { InvalidCatalogResponseError, parseCatalogResponse, type InitialCatalog } from './catalog-response';

/** Render-time reads never receive the /api-scoped refresh token or set cookies. */
export async function readInitialCatalog(): Promise<InitialCatalog> {
  const origin = publicOrigin(process.env.ELEARNING_FRONT_URL);
  if (!origin) return { data: null, error: 'Les formations sont temporairement indisponibles. Réessayez.', status: 503 };
  const access = (await cookies()).get('accessToken')?.value;
  if (isExpiredJwt(access)) return { data: null, error: 'Votre session doit être renouvelée. Réessayez depuis cette page.', status: 401 };
  const request: typeof requestBff = async <T>(path: string, init: RequestInit = {}) => {
    const target = new URL(path, origin);
    if (target.origin !== origin || (init.method ?? 'GET') !== 'GET') throw new BffRequestError(503, 'Lecture indisponible.');
    const response = await forwardToBff(new NextRequest(target, { method: 'GET', headers: { Accept: 'application/json', Cookie: `accessToken=${encodeURIComponent(access!)}` } }), configuredBffUrl(), target.pathname);
    if (!response.ok) throw new BffRequestError(response.status, 'Lecture indisponible.');
    return await response.json() as T;
  };
  try {
    const receipt = await createElearningClient(request).getElearningCatalog();
    return { data: parseCatalogResponse(receipt.data), error: null, status: 200 };
  } catch (error) {
    const status = error instanceof BffRequestError ? error.status : error instanceof InvalidCatalogResponseError ? 502 : 503;
    return { data: null, status, error: status === 401 ? 'Votre session doit être renouvelée. Réessayez depuis cette page.' : status === 403 ? 'Votre compte ne permet pas cette lecture.' : 'Les formations sont temporairement indisponibles. Réessayez.' };
  }
}
