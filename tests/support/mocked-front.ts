import assert from 'node:assert/strict';
import path from 'node:path';
import { installWindow, removeWindow, type FakeWindow } from './browser';
import { ContractMockServer, type MockReply } from './contract-mock-server';
import { apiError, accessToken, adminStatsResponse, trainingTimeResponse } from './elearning-fixtures';
import { setBrowserFrontUrls } from '../../src/lib/front-urls';
import { FrontRuntime, FRONT_ORIGIN } from './front-runtime';
import { OpenApiContract } from './openapi-contract';
import { loadOrvalContract } from './orval-contract';

// Front complet (vrai middleware, vrais route handlers, vrai code client) branché sur son unique BFF : BFF E-learning,
// simulé depuis le paquet publié @mairie360/bff-elearning-openapi (version épinglée dans package.json).
// Après chaque test : aucune violation de contrat côté mock, aucun appel réseau hors périmètre côté front.

type Hook = (fn: () => unknown) => void;
export type NodeTestHooks = { before: Hook; after: Hook; beforeEach: Hook; afterEach: Hook };

export const PUBLISHED_CONTRACT_PACKAGE = '@mairie360/bff-elearning-openapi';

/** Copie versionnée du contrat (allowlist du proxy), identique à la release publiée. */
export const contractSnapshot = OpenApiContract.load(path.join(__dirname, '..', '..', 'contracts', 'openapi.json'));

/**
 * Réponse d'erreur du BFF. Orval ne type que les succès : l'erreur est donc hors du contrat du paquet, mais son corps
 * doit respecter le schéma `ErrorResponse` du contrat publié ({ error: { code, message, details } }, enveloppe commune des BFFs).
 */
export function errorReply(status: number, code: string, message: string): MockReply {
  const body = apiError(code, message);
  assert.deepEqual(contractSnapshot.validate(contractSnapshot.schema('ErrorResponse'), body), []);
  return { status, body, outOfContract: true };
}

/** Reads the page makes on its own once the catalogue is loaded (training time, administrator indicators). */
export const SIDE_READS = new Set(['GET /elearning/training-time', 'GET /elearning/admin/stats']);

export type MockedFront = {
  bffElearning: ContractMockServer;
  runtime: FrontRuntime;
  window: () => FakeWindow;
  /** Origines volontairement injoignables (BFF arrêté), autorisées comme cible du proxy. */
  offline: string[];
  /** Opérations BFF E-learning (`METHOD /template`) reçues pendant tout le fichier de test. */
  elearningOperations: Set<string>;
};

export function useMockedFront({ before, after, beforeEach, afterEach }: NodeTestHooks): MockedFront {
  const bffElearning = new ContractMockServer('BFF_ELEARNING', loadOrvalContract(PUBLISHED_CONTRACT_PACKAGE));
  const offline: string[] = [];
  const runtime = new FrontRuntime(() => [bffElearning.url, ...offline].map((url) => new URL(url).origin));
  const elearningOperations = new Set<string>();
  let fakeWindow: FakeWindow | undefined;

  before(async () => {
    await bffElearning.start();
    runtime.install();
  });
  after(async () => {
    runtime.restore();
    await bffElearning.stop();
  });
  beforeEach(() => {
    bffElearning.reset();
    runtime.reset();
    runtime.owner = undefined;
    offline.length = 0;
    // Relue à chaque requête par src/lib/bff-proxy.ts.
    process.env.BFF_ELEARNING_BASE_URL = bffElearning.url;
    runtime.accessToken = accessToken();
    process.env.ELEARNING_FRONT_URL = FRONT_ORIGIN;
    process.env.LOGIN_FRONT_URL = 'https://login.mairie.test/';
    // E-learning V2 reads beside the catalogue (MAIR-1144, MAIR-1150): the page reads them once it knows the role.
    // A test that is about them mocks them again; SIDE_READS lets the others leave them out of their call lists.
    bffElearning.on('GET', '/elearning/training-time', ({ url }) => ({ body: trainingTimeResponse(Number(url.searchParams.get('year')) || undefined) }));
    bffElearning.on('GET', '/elearning/admin/stats', { body: adminStatsResponse() });
    fakeWindow = installWindow();
    setBrowserFrontUrls({ ELEARNING_FRONT_URL: FRONT_ORIGIN, LOGIN_FRONT_URL: 'https://login.mairie.test/' });
  });
  afterEach(() => {
    bffElearning.requests.forEach((request) => elearningOperations.add(`${request.method} ${request.template}`));
    removeWindow();
    assert.deepEqual([...bffElearning.violations, ...runtime.violations], []);
  });

  return { bffElearning, runtime, window: () => fakeWindow!, offline, elearningOperations };
}
