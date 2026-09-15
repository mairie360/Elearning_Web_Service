import assert from 'node:assert/strict';
import path from 'node:path';
import { installWindow, removeWindow, type FakeWindow } from './browser';
import { ContractMockServer } from './contract-mock-server';
import { accessToken } from './elearning-fixtures';
import { FrontRuntime } from './front-runtime';
import { OpenApiContract } from './openapi-contract';
import { loadOrvalContract } from './orval-contract';

// Front complet (vrai middleware, vrais route handlers, vrai code client) branché sur deux BFF simulés :
// BFF E-learning piloté par contracts/openapi.json et BFF User piloté par le paquet @mairie360/bff-user-openapi.
// Après chaque test : aucune violation de contrat côté mocks, aucun appel réseau hors périmètre côté front.

type Hook = (fn: () => unknown) => void;
export type NodeTestHooks = { before: Hook; after: Hook; beforeEach: Hook; afterEach: Hook };

export type MockedFront = {
  bffElearning: ContractMockServer;
  userBff: ContractMockServer;
  runtime: FrontRuntime;
  window: () => FakeWindow;
  /** Origines volontairement injoignables (BFF arrêté), autorisées comme cible du proxy. */
  offline: string[];
  /** Opérations BFF E-learning (`METHOD /template`) reçues pendant tout le fichier de test. */
  elearningOperations: Set<string>;
};

export function useMockedFront({ before, after, beforeEach, afterEach }: NodeTestHooks): MockedFront {
  const bffElearning = new ContractMockServer('BFF_ELEARNING', OpenApiContract.load(path.join(__dirname, '..', '..', 'contracts', 'openapi.json')));
  const userBff = new ContractMockServer('USER_BFF', loadOrvalContract('@mairie360/bff-user-openapi'));
  const offline: string[] = [];
  const runtime = new FrontRuntime(() => [bffElearning.url, userBff.url, ...offline].map((url) => new URL(url).origin));
  const elearningOperations = new Set<string>();
  let fakeWindow: FakeWindow | undefined;

  before(async () => {
    await Promise.all([bffElearning.start(), userBff.start()]);
    runtime.install();
  });
  after(async () => {
    runtime.restore();
    await Promise.all([bffElearning.stop(), userBff.stop()]);
  });
  beforeEach(() => {
    bffElearning.reset();
    userBff.reset();
    runtime.reset();
    offline.length = 0;
    // Relues à chaque requête par src/lib/bff-proxy.ts et src/lib/user-bff-proxy.ts.
    process.env.BFF_ELEARNING_BASE_URL = bffElearning.url;
    process.env.USER_BFF_URL = userBff.url;
    runtime.accessToken = accessToken();
    fakeWindow = installWindow();
  });
  afterEach(() => {
    bffElearning.requests.forEach((request) => elearningOperations.add(`${request.method} ${request.template}`));
    removeWindow();
    assert.deepEqual([...bffElearning.violations, ...userBff.violations, ...runtime.violations], []);
  });

  return { bffElearning, userBff, runtime, window: () => fakeWindow!, offline, elearningOperations };
}
