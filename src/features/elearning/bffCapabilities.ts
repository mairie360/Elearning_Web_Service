// Operations the pinned BFF_Elearning really serves. Since MAIR-401 the BFF reads the E-learning API instead of an
// in-memory mock and answers 501 to what no upstream service persists yet, "instead of faking persistence":
// course ratings, the administration of courses and marking a content as not completed. The shared catalogue
// hides a control whose callback is absent, so the page only wires the callbacks of the capabilities below
// (MAIR-513). Flip a flag once the published contract stops answering 501 for that operation.
export interface CatalogCapabilities {
  /** `POST /elearning/courses/{courseId}/rating` persists the learner's note. */
  courseRating: boolean;
  /** `POST`/`PATCH`/`DELETE /elearning/admin/courses…` create, edit and delete courses. */
  courseManagement: boolean;
  /** `POST …/complete` accepts `completed: false`. */
  contentUncompletion: boolean;
}

/** What the BFF_Elearning version pinned in package.json serves: progress and course starts only. */
export const pinnedBffCapabilities: CatalogCapabilities = {
  courseRating: false,
  courseManagement: false,
  contentUncompletion: false,
};

/** Every operation of the contract, for the day the BFF serves them all (and for the tests of those flows). */
export const fullCatalogCapabilities: CatalogCapabilities = {
  courseRating: true,
  courseManagement: true,
  contentUncompletion: true,
};

export const COURSE_MANAGEMENT_UNAVAILABLE_MESSAGE =
  "La gestion des formations (création, modification, suppression) n’est pas encore disponible dans le service de formation.";

export const CONTENT_UNCOMPLETION_UNAVAILABLE_MESSAGE =
  "Le service de formation ne permet pas encore de décocher un contenu terminé. Votre progression reste inchangée.";
