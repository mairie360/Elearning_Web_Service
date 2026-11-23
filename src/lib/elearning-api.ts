import type { components } from "../contracts/bff";
import { bffElearning } from "./bff-client";
import { parseCatalogResponse } from './catalog-response';

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
export type AdminCourseBody = Schemas["AdminCourseCreateBody"];
export type TrainingTimeResponse = Schemas["TrainingTimeResponse"];
export type AdminStatsResponse = Schemas["AdminStatsResponse"];
export type RatingSubmitResponse = Schemas["RatingSubmitResponse"];

/** A PDF of the BFF with the name it gives in `Content-Disposition`, else `fallback`. */
export interface DownloadedFile {
  blob: Blob;
  fileName: string;
}

/** `filename*=UTF-8''…` first (RFC 6266), then `filename="…"`. */
export function fileNameFromDisposition(header: unknown, fallback: string) {
  if (typeof header !== "string") return fallback;
  const extended = /filename\*\s*=\s*(?:UTF-8|utf-8)''([^;]+)/.exec(header);
  if (extended) {
    try {
      const name = decodeURIComponent(extended[1].trim().replace(/^"|"$/g, ""));
      if (name.trim()) return name.trim();
    } catch {
      // A malformed escape falls back to the plain parameter.
    }
  }
  const plain = /filename\s*=\s*("([^"]*)"|[^;]+)/.exec(header);
  const name = (plain?.[2] ?? plain?.[1] ?? "").trim();
  return name || fallback;
}

function downloaded(response: { data: Blob; headers: Record<string, unknown> }, fallback: string): DownloadedFile {
  return { blob: response.data, fileName: fileNameFromDisposition(response.headers["content-disposition"], fallback) };
}

export async function getCatalog(init?: RequestInit) {
  return parseCatalogResponse(await withSignal(init, (options) => bffElearning.getElearningCatalog(undefined, options)));
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

export async function createCourse(course: AdminCourseBody) {
  return (await bffElearning.postElearningAdminCourses(course)).data;
}

export async function updateCourse(course: AdminCourseBody & { id: string }) {
  return (await bffElearning.patchElearningAdminCoursesCourseId(pathSegment(course.id, "courseId"), course)).data;
}

export async function deleteCourse(courseId: string) {
  return (await bffElearning.deleteElearningAdminCoursesCourseId(pathSegment(courseId, "courseId"))).data;
}

/** MAIR-1144: the caller's training time of `year` (yearly goal, time spent, courses completed). */
export function getTrainingTime(year: number, init?: RequestInit) {
  return withSignal(init, (options) => bffElearning.getElearningTrainingTime({ year }, options));
}

/** MAIR-1149: the attestation of a course the caller completed. */
export async function downloadCourseCertificate(courseId: string) {
  const response = await bffElearning.getElearningCoursesCourseIdCertificate(pathSegment(courseId, "courseId"));
  return downloaded(response as { data: Blob; headers: Record<string, unknown> }, `attestation-${courseId}.pdf`);
}

/** MAIR-1144: the attestations of the courses the caller completed during `year`, in one PDF. */
export async function downloadYearCertificates(year: number) {
  const response = await bffElearning.getElearningCertificates({ year });
  return downloaded(response as { data: Blob; headers: Record<string, unknown> }, `attestations-${year}.pdf`);
}

/** MAIR-817: where to open a stored file of a course (a signed URL, valid a few minutes). */
export function getContentFile(courseId: string, chapterId: string, contentId: string, init?: RequestInit) {
  return withSignal(init, (options) => bffElearning.getElearningCoursesCourseIdChaptersChapterIdContentsContentIdFile(
    pathSegment(courseId, "courseId"),
    pathSegment(chapterId, "chapterId"),
    pathSegment(contentId, "contentId"),
    options,
  ));
}

/** MAIR-1150: the indicators of the instance (administrators). */
export function getAdminStats(init?: RequestInit) {
  return withSignal(init, (options) => bffElearning.getElearningAdminStats(options));
}

/** MAIR-1150: reminds the late agents of a mandatory course (every late agent without `userIds`). */
export async function sendReminders(courseId: string, userIds?: string[]) {
  return (await bffElearning.postElearningAdminCoursesCourseIdReminders(pathSegment(courseId, "courseId"), userIds ? { userIds } : {})).data;
}
