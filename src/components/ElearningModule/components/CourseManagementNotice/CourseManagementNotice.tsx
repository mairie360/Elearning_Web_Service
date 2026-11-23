import { Alert } from '@mairie360/lib-components/primitives';

import { COURSE_MANAGEMENT_UNAVAILABLE_MESSAGE } from '@/features/elearning/bffCapabilities';

/** MAIR-934: administrators are told why the author actions are missing. */
export const CourseManagementNotice = () => (
  <Alert data-elearning-capability-notice role="note" tone="info" title="Gestion des formations indisponible" description={COURSE_MANAGEMENT_UNAVAILABLE_MESSAGE} />
);
