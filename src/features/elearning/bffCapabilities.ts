// Operations the pinned BFF_Elearning really serves. Since MAIR-401 the BFF reads the E-learning API, and since
// BFF_Elearning#251 (E-learning V2) it stores ratings and administers courses too. Marking a content as not completed
// still has no upstream operation: the BFF answers 501, so the page refuses it locally (MAIR-513). The shared catalogue
// hides a control whose callback is absent, so the page only wires the callbacks of the capabilities below.
export interface CatalogCapabilities {
  /** `POST /elearning/courses/{courseId}/rating` persists the learner's note. */
  courseRating: boolean;
  /** `POST`/`PATCH`/`DELETE /elearning/admin/courses…` create, edit and delete courses. */
  courseManagement: boolean;
  /** `POST …/complete` accepts `completed: false`. */
  contentUncompletion: boolean;
}

/** What the BFF_Elearning version pinned in package.json serves: everything but un-completing a content. */
export const pinnedBffCapabilities: CatalogCapabilities = {
  courseRating: true,
  courseManagement: true,
  contentUncompletion: false,
};

/** Every operation of the contract (for the tests of the un-completion flow). */
export const fullCatalogCapabilities: CatalogCapabilities = {
  courseRating: true,
  courseManagement: true,
  contentUncompletion: true,
};

export const CONTENT_UNCOMPLETION_UNAVAILABLE_MESSAGE =
  "Le service de formation ne permet pas encore de décocher un contenu terminé. Votre progression reste inchangée.";
