import React from 'react';

import { ElearningAdminStats, type ElearningAdminStatsData } from './ElearningAdminStats';
import { ElearningCourseFormModal, type ElearningCourseFormValues } from './ElearningCourseFormModal';
import type { ElearningLearnerActionResult } from './ElearningCourseRating';
import type { ElearningFilterOption } from './ElearningFilterSelect';
import { ElearningStatCard, type ElearningStatCardProps } from './ElearningStatCard';
import { CatalogEmptyState } from './catalog/CatalogEmptyState';
import { CatalogFilters } from './catalog/CatalogFilters';
import { CatalogHeader } from './catalog/CatalogHeader';
import { ManagedCourseCard } from './catalog/ManagedCourseCard';
import { SelectedCourseDetails } from './catalog/SelectedCourseDetails';
import {
  buildAdminStats,
  buildCategories,
  buildCourseFromFormValues,
  buildDefaultStats,
  closeWhenSaved,
  defaultStatuses,
  filterCourses,
  getCourseDetails,
  getCourseFormValues,
} from './catalog/catalog-model';
import type { ElearningCourse, ElearningCourseSaveResult, ElearningUserRole } from './catalog/catalog-types';
import type {
  ElearningCourseContentCompletePayload,
  ElearningCourseContentItem,
  ElearningCourseRatingSummary,
} from './course-details/types';
import { joinClasses } from './style';

export type { ElearningCourse, ElearningCourseSaveResult, ElearningUserRole } from './catalog/catalog-types';

export interface ElearningCatalogProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  subtitle?: string;
  certificationCount?: number;
  courses: ElearningCourse[];
  stats?: ElearningStatCardProps[];
  adminStats?: ElearningAdminStatsData;
  categories?: ElearningFilterOption[];
  statuses?: ElearningFilterOption[];
  defaultSearch?: string;
  defaultCategory?: string;
  defaultStatus?: string;
  emptyLabel?: string;
  currentUserRole?: ElearningUserRole;
  initialCourseId?: string | null;
  onCourseClose?: () => void;
  onCourseAction?: (course: ElearningCourse) => ElearningLearnerActionResult;
  onCreateCourse?: (course: ElearningCourse, values: ElearningCourseFormValues) => ElearningCourseSaveResult;
  onUpdateCourse?: (course: ElearningCourse, values: ElearningCourseFormValues) => ElearningCourseSaveResult;
  onDeleteCourse?: (course: ElearningCourse) => void;
  onCourseRatingSubmit?: (course: ElearningCourse, rating: number, summary: ElearningCourseRatingSummary) => ElearningLearnerActionResult;
  allowRatingEdits?: boolean;
  renderCourseReview?: (course: ElearningCourse) => React.ReactNode;
  onCourseContentDownload?: (course: ElearningCourse, content: ElearningCourseContentItem) => ElearningLearnerActionResult;
  canCompleteCourseContent?: (course: ElearningCourse, content: ElearningCourseContentItem) => boolean;
  onCourseContentComplete?: (course: ElearningCourse, payload: ElearningCourseContentCompletePayload) => ElearningLearnerActionResult;
}

export const ElearningCatalog = ({
  title = 'Centre de formation',
  subtitle = 'Développez vos compétences professionnelles',
  certificationCount = 0,
  courses,
  stats,
  adminStats,
  categories,
  statuses = defaultStatuses,
  defaultSearch = '',
  defaultCategory = 'all',
  defaultStatus = 'all',
  emptyLabel = 'Aucune formation ne correspond aux filtres.',
  currentUserRole = 'user',
  initialCourseId = null,
  onCourseClose,
  onCourseAction,
  onCreateCourse,
  onUpdateCourse,
  onDeleteCourse,
  onCourseRatingSubmit,
  allowRatingEdits = false,
  onCourseContentComplete,
  onCourseContentDownload,
  canCompleteCourseContent,
  renderCourseReview,
  className = '',
  ...props
}: ElearningCatalogProps) => {
  const [search, setSearch] = React.useState(defaultSearch);
  const [category, setCategory] = React.useState(defaultCategory);
  const [status, setStatus] = React.useState(defaultStatus);
  const [selectedCourseId, setSelectedCourseId] = React.useState<string | null>(initialCourseId);
  const [editingCourseId, setEditingCourseId] = React.useState<string | null>(null);
  const [courseFormOpen, setCourseFormOpen] = React.useState(false);
  const [starting, setStarting] = React.useState(false);
  const [startError, setStartError] = React.useState<string | null>(null);
  const pendingStart = React.useRef(false);
  const selectedCourse = courses.find((course) => course.id === selectedCourseId);
  const editingCourse = courses.find((course) => course.id === editingCourseId);

  const canManageCourses = currentUserRole === 'administrator';
  const categoryOptions = React.useMemo(() => categories ?? buildCategories(courses), [categories, courses]);
  const displayedStats = stats ?? buildDefaultStats(courses, certificationCount);
  const displayedAdminStats = adminStats ?? buildAdminStats(courses);
  const selectedCourseDetails = React.useMemo(() => (selectedCourse ? getCourseDetails(selectedCourse) : undefined), [selectedCourse]);
  const courseFormInitialValues = React.useMemo(() => getCourseFormValues(editingCourse ?? undefined), [editingCourse]);

  const filteredCourses = React.useMemo(() => filterCourses(courses, search, category, status), [category, courses, search, status]);

  const closeCourseForm = () => {
    setCourseFormOpen(false);
    setEditingCourseId(null);
  };

  const handleSubmitCourseForm = (values: ElearningCourseFormValues) => {
    const saveCourse = editingCourse ? onUpdateCourse : onCreateCourse;
    if (!saveCourse) return false;
    return closeWhenSaved(saveCourse(buildCourseFromFormValues(values, editingCourse), values), closeCourseForm);
  };

  const openCourseForm = (course?: ElearningCourse) => {
    setEditingCourseId(course?.id ?? null);
    setCourseFormOpen(true);
  };

  const handleOpenCourse = async (course: ElearningCourse) => {
    if (pendingStart.current) return;
    pendingStart.current = true;
    setStarting(true);
    setStartError(null);
    setSelectedCourseId(course.id);
    try {
      course.onAction?.();
      const result = onCourseAction?.(course);
      const confirmed = result && typeof result === 'object' ? await result : result;
      if (confirmed === false) setStartError('La formation n’a pas pu être démarrée. Fermez le détail puis réessayez.');
    } catch {
      setStartError('La formation n’a pas pu être démarrée. Fermez le détail puis réessayez.');
    } finally {
      pendingStart.current = false;
      setStarting(false);
    }
  };

  const filtered = search.trim() || category !== 'all' || status !== 'all';

  return (
    <section className={joinClasses('bg-[var(--mairie-surface-raised)] px-6 py-14 text-[var(--mairie-text)]', className)} {...props}>
      <div className="mx-auto max-w-[1130px]">
        <CatalogHeader title={title} subtitle={subtitle} onCreate={canManageCourses && onCreateCourse ? () => openCourseForm() : undefined} />

        {canManageCourses ? <ElearningAdminStats stats={displayedAdminStats} /> : null}

        <CatalogFilters
          search={search}
          category={category}
          status={status}
          categories={categoryOptions}
          statuses={statuses}
          onSearchChange={setSearch}
          onCategoryChange={setCategory}
          onStatusChange={setStatus}
        />

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {displayedStats.map((stat) => <ElearningStatCard key={stat.label} {...stat} />)}
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => (
            <ManagedCourseCard
              key={course.id}
              course={course}
              actionDisabled={starting}
              onOpen={(item) => { void handleOpenCourse(item); }}
              onEdit={canManageCourses && onUpdateCourse ? openCourseForm : undefined}
              onDelete={canManageCourses && onDeleteCourse ? onDeleteCourse : undefined}
            />
          ))}
        </div>

        {filteredCourses.length === 0 ? (
          <CatalogEmptyState label={emptyLabel} onResetFilters={filtered ? () => { setSearch(''); setCategory('all'); setStatus('all'); } : undefined} />
        ) : null}
      </div>

      {selectedCourse && selectedCourseDetails ? (
        <SelectedCourseDetails
          course={selectedCourse}
          details={selectedCourseDetails}
          starting={starting}
          startError={startError}
          allowRatingEdits={allowRatingEdits}
          review={renderCourseReview?.(selectedCourse)}
          onRatingSubmit={onCourseRatingSubmit}
          onContentComplete={onCourseContentComplete}
          onContentDownload={onCourseContentDownload}
          canCompleteContent={canCompleteCourseContent}
          onClose={() => {
            setSelectedCourseId(null);
            onCourseClose?.();
          }}
        />
      ) : null}

      <ElearningCourseFormModal
        isOpen={courseFormOpen}
        title={editingCourse ? 'Modifier la formation' : 'Nouvelle formation'}
        submitLabel={editingCourse ? 'Enregistrer' : 'Créer'}
        initialValues={courseFormInitialValues}
        statusOptions={statuses}
        onCancel={closeCourseForm}
        onSubmit={handleSubmitCourseForm}
      />
    </section>
  );
};
