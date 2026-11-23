import React from 'react';

import { ElearningAdminStats, type ElearningAdminStatsData } from './components/ElearningAdminStats';
import { ElearningCourseFormModal, type ElearningCourseFormValues } from './components/ElearningCourseFormModal';
import { CatalogEmptyState } from './components/CatalogEmptyState';
import { CatalogFilters } from './components/CatalogFilters';
import { CatalogHeader } from './components/CatalogHeader';
import { LearnerMetrics } from './components/LearnerMetrics';
import { ManagedCourseCard } from './components/ManagedCourseCard';
import { ResumeCard } from './components/ResumeCard';
import { SelectedCourseDetails } from './components/SelectedCourseDetails';
import {
  buildAdminStats,
  buildCategories,
  buildCourseFromFormValues,
  buildLearnerMetrics,
  closeWhenSaved,
  defaultStatuses,
  filterCourses,
  getCourseDetails,
  getCourseFormValues,
  requirementFilterOptions,
  resultCountLabel,
  resumeSuggestion,
  statusFilterOptions,
} from './catalog-model';
import type { ElearningCourse, ElearningCourseSaveResult, ElearningFilterOption, ElearningUserRole } from './catalog-types';
import type { ElearningLearnerActionResult } from './course-types';
import { joinClasses } from './elearning-style';

export type { ElearningCourse, ElearningCourseSaveResult, ElearningFilterOption, ElearningUserRole } from './catalog-types';

export interface ElearningCatalogProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  subtitle?: string;
  courses: ElearningCourse[];
  adminStats?: ElearningAdminStatsData;
  /** `loading` while the administrator refreshes, `unavailable` when the last catalogue read failed. */
  adminStatsState?: 'default' | 'loading' | 'unavailable';
  onRefreshStats?: () => void;
  categories?: ElearningFilterOption[];
  statuses?: ElearningFilterOption[];
  defaultSearch?: string;
  defaultCategory?: string;
  defaultStatus?: string;
  defaultRequirement?: string;
  /** Every filter change goes up (URL state); nothing reads the DOM of the filters (MAIR-897). */
  onSearchChange?: (value: string) => void;
  onCategoryChange?: (value: string) => void;
  onStatusChange?: (value: string) => void;
  onRequirementChange?: (value: string) => void;
  emptyLabel?: string;
  currentUserRole?: ElearningUserRole;
  initialCourseId?: string | null;
  onCourseClose?: () => void;
  onCourseAction?: (course: ElearningCourse) => ElearningLearnerActionResult;
  onCreateCourse?: (course: ElearningCourse, values: ElearningCourseFormValues) => ElearningCourseSaveResult;
  onUpdateCourse?: (course: ElearningCourse, values: ElearningCourseFormValues) => ElearningCourseSaveResult;
  onDeleteCourse?: (course: ElearningCourse) => void;
  /** Opens the course screen (MAIR-1148) at the current chapter of the course. */
  onPlayCourse?: (course: ElearningCourse) => void;
}

export const ElearningCatalog = ({
  title = 'E-learning',
  subtitle = 'Développez vos compétences à votre rythme.',
  courses,
  adminStats,
  adminStatsState = 'default',
  onRefreshStats,
  categories,
  statuses = defaultStatuses,
  defaultSearch = '',
  defaultCategory = 'all',
  defaultStatus = 'all',
  defaultRequirement = 'all',
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onRequirementChange,
  emptyLabel = 'Aucune formation disponible pour l’instant.',
  currentUserRole = 'user',
  initialCourseId = null,
  onCourseClose,
  onCourseAction,
  onCreateCourse,
  onUpdateCourse,
  onDeleteCourse,
  onPlayCourse,
  className = '',
  ...props
}: ElearningCatalogProps) => {
  const [search, setSearchState] = React.useState(defaultSearch);
  const [category, setCategoryState] = React.useState(defaultCategory);
  const [status, setStatusState] = React.useState(defaultStatus);
  const [requirement, setRequirementState] = React.useState(defaultRequirement);
  const setSearch = (value: string) => { setSearchState(value); onSearchChange?.(value); };
  const setCategory = (value: string) => { setCategoryState(value); onCategoryChange?.(value); };
  const setStatus = (value: string) => { setStatusState(value); onStatusChange?.(value); };
  const setRequirement = (value: string) => { setRequirementState(value); onRequirementChange?.(value); };
  const [selectedCourseId, setSelectedCourseId] = React.useState<string | null>(initialCourseId);
  const [editingCourseId, setEditingCourseId] = React.useState<string | null>(null);
  const [courseFormOpen, setCourseFormOpen] = React.useState(false);
  const [startingCourseId, setStartingCourseId] = React.useState<string | null>(null);
  const starting = startingCourseId !== null;
  const [startError, setStartError] = React.useState<string | null>(null);
  const pendingStart = React.useRef(false);
  const selectedCourse = courses.find((course) => course.id === selectedCourseId);
  const editingCourse = courses.find((course) => course.id === editingCourseId);

  const canManageCourses = currentUserRole === 'administrator';
  const categoryOptions = React.useMemo(() => categories ?? buildCategories(courses), [categories, courses]);
  const learnerMetrics = React.useMemo(() => buildLearnerMetrics(courses), [courses]);
  const displayedAdminStats = adminStats ?? buildAdminStats(courses);
  const selectedCourseDetails = React.useMemo(() => (selectedCourse ? getCourseDetails(selectedCourse) : undefined), [selectedCourse]);
  const suggestion = React.useMemo(() => (canManageCourses ? undefined : resumeSuggestion(courses)), [canManageCourses, courses]);
  const courseFormInitialValues = React.useMemo(() => getCourseFormValues(editingCourse ?? undefined), [editingCourse]);

  const filteredCourses = React.useMemo(() => filterCourses(courses, search, category, status, requirement), [category, courses, requirement, search, status]);

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

  /** « Commencer » (sheet or top card): start the course, then open its screen once the start is confirmed. */
  const handleStartCourse = async (course: ElearningCourse) => {
    if (pendingStart.current) return;
    pendingStart.current = true;
    setStartingCourseId(course.id);
    setStartError(null);
    try {
      course.onAction?.();
      const result = onCourseAction?.(course);
      const confirmed = result && typeof result === 'object' ? await result : result;
      if (confirmed === false) setStartError('La formation n’a pas pu être démarrée. Fermez le détail puis réessayez.');
      else if (onPlayCourse) { setSelectedCourseId(null); onPlayCourse(course); }
    } catch {
      setStartError('La formation n’a pas pu être démarrée. Fermez le détail puis réessayez.');
    } finally {
      pendingStart.current = false;
      setStartingCourseId(null);
    }
  };

  const openCourse = (course: ElearningCourse) => { setStartError(null); setSelectedCourseId(course.id); };

  const filtered = Boolean(search.trim()) || category !== 'all' || status !== 'all' || requirement !== 'all';
  const resetFilters = () => { setSearch(''); setCategory('all'); setStatus('all'); setRequirement('all'); };

  return (
    <section className={joinClasses('flex flex-col gap-6 text-[var(--mairie-text)]', className)} {...props}>
        <CatalogHeader title={title} subtitle={subtitle} onCreate={canManageCourses && onCreateCourse ? () => openCourseForm() : undefined} />

        {suggestion ? (
          <ResumeCard
            suggestion={suggestion}
            busy={startingCourseId === suggestion.course.id}
            onResume={(course) => (suggestion.kind === 'resume' && onPlayCourse ? onPlayCourse(course) : void handleStartCourse(course))}
            onShowDetails={openCourse}
          />
        ) : null}

        {canManageCourses ? <ElearningAdminStats stats={displayedAdminStats} state={adminStatsState} onRefresh={onRefreshStats} /> : (
          <LearnerMetrics
            metrics={learnerMetrics}
            active={{ status, requirement }}
            onSelect={(filter) => { setStatus(filter.status); setRequirement(filter.requirement); }}
          />
        )}

        <CatalogFilters
          search={search}
          category={category}
          status={status}
          requirement={requirement}
          categories={categoryOptions}
          statuses={[{ label: 'Tous les statuts', value: 'all' }, ...statusFilterOptions]}
          requirements={requirementFilterOptions}
          resultLabel={resultCountLabel(filteredCourses.length, filtered)}
          onSearchChange={setSearch}
          onCategoryChange={setCategory}
          onStatusChange={setStatus}
          onRequirementChange={setRequirement}
        />

        <div className="grid items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => (
            <ManagedCourseCard
              key={course.id}
              course={course}
              busy={startingCourseId === course.id}
              onOpen={openCourse}
              onEdit={canManageCourses && onUpdateCourse ? openCourseForm : undefined}
              onDelete={canManageCourses && onDeleteCourse ? onDeleteCourse : undefined}
            />
          ))}
        </div>

        {filteredCourses.length === 0 ? (
          <CatalogEmptyState label={filtered ? 'Aucune formation ne correspond à votre recherche.' : emptyLabel} onResetFilters={filtered ? resetFilters : undefined} />
        ) : null}

      {selectedCourse && selectedCourseDetails ? (
        <SelectedCourseDetails
          course={selectedCourse}
          details={selectedCourseDetails}
          starting={startingCourseId === selectedCourse.id}
          startError={startError}
          onStart={(course) => void handleStartCourse(course)}
          onPlay={onPlayCourse ? (course) => { setSelectedCourseId(null); onPlayCourse(course); } : undefined}
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
