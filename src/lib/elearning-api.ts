import type { components } from "../contracts/bff";
import { bffElearning } from "./bff-client";

// Only entry point of the browser to the E-learning BFF. Every call goes through an operation of the
// generated client of the published contract (@mairie360/bff-elearning-openapi): paths, methods and
// parameters are owned by the package, and an operation missing from it does not compile.
// tests/network-boundary.test.cjs forbids any other network call, tests/elearning.bff-mocks.test.cjs replays
// every operation against a BFF mock driven by the contract.

type Schemas = components["schemas"];

/** The generated client does not escape path parameters: refuse an empty one and encode the others. */
export function pathSegment(value: string, name: string) {
  if (!value) {
    throw new Error(`Missing path parameter "${name}".`);
  }

  return encodeURIComponent(value);
}

/**
 * Runs a read operation with the abort signal of the caller. Axios turns an aborted signal into a
 * CanceledError: rethrow the signal reason (an AbortError) instead, as the callers expect.
 */
async function withSignal<T>(init: RequestInit | undefined, call: (options: { signal?: AbortSignal }) => Promise<{ data: T }>) {
  const signal = init?.signal ?? undefined;
  signal?.throwIfAborted();
  try {
    return (await call({ signal })).data;
  } catch (error) {
    if (signal?.aborted && error instanceof Error && error.name === "CanceledError") throw signal.reason;
    throw error;
  }
}

export type ElearningCatalogResponse = Schemas["ElearningCatalogResponse"];
export type ElearningProfileResponse = Schemas["ElearningProfileResponse"];
export type ElearningCourse = Schemas["ElearningCourse"];
export type CompleteContentBody = Schemas["CompleteContentBody"];

export function getCatalog(init?: RequestInit) {
  return withSignal(init, (options) => bffElearning.getElearningCatalog(undefined, options));
}

export function getProfile(init?: RequestInit) {
  return withSignal(init, (options) => bffElearning.getElearningProfile(options));
}

export async function startCourse(courseId: string) {
  return (await bffElearning.postElearningCoursesCourseIdStart(pathSegment(courseId, "courseId"), {})).data;
}

export async function completeCourseContent(
  courseId: string,
  contentId: string,
  body: CompleteContentBody,
) {
  return (
    await bffElearning.postElearningCoursesCourseIdContentsContentIdComplete(
      pathSegment(courseId, "courseId"),
      pathSegment(contentId, "contentId"),
      body,
    )
  ).data;
}

export async function rateCourse(courseId: string, rating: number) {
  return (await bffElearning.postElearningCoursesCourseIdRating(pathSegment(courseId, "courseId"), { rating })).data;
}

export async function createCourse(course: ElearningCourse) {
  return (await bffElearning.postElearningAdminCourses(course)).data;
}

export async function updateCourse(course: ElearningCourse) {
  return (await bffElearning.patchElearningAdminCoursesCourseId(pathSegment(course.id, "courseId"), course)).data;
}

export async function deleteCourse(courseId: string) {
  return (await bffElearning.deleteElearningAdminCoursesCourseId(pathSegment(courseId, "courseId"))).data;
}
