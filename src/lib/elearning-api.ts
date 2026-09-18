import type { components, paths } from "../contracts/bff";
import { requestBff } from "./bff-client";

// Seul point d'accès du navigateur au BFF E-learning. Chemins, méthodes, paramètres, corps et réponses
// sont typés depuis src/contracts/bff.d.ts (généré à partir de contracts/openapi.json) : une opération
// absente du contrat ne compile pas. tests/network-boundary.test.cjs interdit tout autre appel réseau,
// tests/elearning.bff-mocks.test.cjs rejoue chaque opération contre un BFF simulé piloté par le contrat.

type Schemas = components["schemas"];
type HttpMethod = "get" | "post" | "patch" | "delete";
type ContractPath = keyof paths;

/** Méthodes réellement déclarées pour un chemin (les autres sont `?: never` dans le contrat généré). */
type DeclaredMethod<P extends ContractPath> = {
  [M in HttpMethod]: paths[P][M] extends undefined ? never : M;
}[HttpMethod];

type Operation<P extends ContractPath, M extends HttpMethod> = NonNullable<paths[P][M]>;

type PathParams<O> = O extends { parameters: { path: infer T } } ? T : never;

type RequestBody<O> = O extends { requestBody?: { content: { "application/json": infer B } } } ? B : never;

type SuccessBody<O> = O extends { responses: infer R }
  ? {
      [S in keyof R]: S extends 200 | 201
        ? R[S] extends { content: { "application/json": infer B } }
          ? B
          : never
        : never;
    }[keyof R]
  : never;

type CallOptions<O> = {
  path?: PathParams<O>;
  body?: RequestBody<O>;
  init?: RequestInit;
};

export function contractUrl(template: string, params: Record<string, string> = {}) {
  return template.replace(/\{([^}]+)\}/g, (_match, name: string) => {
    const value = params[name];

    if (!value) {
      throw new Error(`Paramètre de chemin "${name}" manquant pour ${template}.`);
    }

    return encodeURIComponent(value);
  });
}

function callBff<P extends ContractPath, M extends DeclaredMethod<P>>(
  method: M,
  template: P,
  { path, body, init = {} }: CallOptions<Operation<P, M>> = {},
) {
  return requestBff<SuccessBody<Operation<P, M>>>(
    contractUrl(template, path as Record<string, string> | undefined),
    {
      ...init,
      method: method.toUpperCase(),
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    },
  );
}

export type ElearningCatalogResponse = Schemas["ElearningCatalogResponse"];
export type ElearningProfileResponse = Schemas["ElearningProfileResponse"];
export type ElearningCourse = Schemas["ElearningCourse"];
export type CompleteContentBody = Schemas["CompleteContentBody"];

export function getCatalog(init?: RequestInit) {
  return callBff("get", "/elearning/catalog", { init });
}

export function getProfile(init?: RequestInit) {
  return callBff("get", "/elearning/profile", { init });
}

export function startCourse(courseId: string) {
  return callBff("post", "/elearning/courses/{courseId}/start", {
    path: { courseId },
    body: {},
  });
}

export function completeCourseContent(
  courseId: string,
  contentId: string,
  body: CompleteContentBody,
) {
  return callBff("post", "/elearning/courses/{courseId}/contents/{contentId}/complete", {
    path: { courseId, contentId },
    body,
  });
}

export function rateCourse(courseId: string, rating: number) {
  return callBff("post", "/elearning/courses/{courseId}/rating", {
    path: { courseId },
    body: { rating },
  });
}

export function createCourse(course: ElearningCourse) {
  return callBff("post", "/elearning/admin/courses", { body: course });
}

export function updateCourse(course: ElearningCourse) {
  return callBff("patch", "/elearning/admin/courses/{courseId}", {
    path: { courseId: course.id },
    body: course,
  });
}

export function deleteCourse(courseId: string) {
  return callBff("delete", "/elearning/admin/courses/{courseId}", {
    path: { courseId },
  });
}
