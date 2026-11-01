import { COURSE_MANAGEMENT_UNAVAILABLE_MESSAGE } from '@/features/elearning/bffCapabilities';

/** Administrators are told why the author actions are missing. */
export const CourseManagementNotice = () => (
  <p data-elearning-capability-notice className="mx-auto mt-6 max-w-[1130px] rounded-md border border-[#d8d2ca] bg-white px-4 py-3 text-sm text-[#5f6470]" role="note">
    {COURSE_MANAGEMENT_UNAVAILABLE_MESSAGE}
  </p>
);
