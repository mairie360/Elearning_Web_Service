/** The indicators of the instance, as `GET /elearning/admin/stats` gives them (MAIR-1150). */
export interface ElearningServiceStats {
  serviceId: string | null;
  serviceName: string | null;
  agents: number;
  participants: number;
  participationRate: number;
}

export interface ElearningCourseStats {
  id: string;
  title: string;
  source: 'internal' | 'platform';
  mandatory: boolean;
  enrolled: number;
  completed: number;
  averageProgress: number;
}

export interface ElearningLateAgent {
  userId: string;
  firstName: string;
  lastName: string;
  courseId: string;
  courseTitle: string;
  deadline: string;
  progress: number;
  lastReminderAt: string | null;
}

export interface ElearningAdminStatsData {
  internalCourses: number;
  platformCourses: number;
  mandatoryInternalCourses: number;
  agents: number;
  participants: number;
  participationRate: number;
  averageCompletion: number;
  lateMandatory: number;
  byService: ElearningServiceStats[];
  byCourse: ElearningCourseStats[];
  lateAgents: ElearningLateAgent[];
}

/** « 79,2 % »: the percentages of the BFF carry one decimal. */
export const formatPercent = (value: number) => `${(Math.round(value * 10) / 10).toLocaleString('fr-FR')} %`;

/** « 1 agent », « 3 agents ». */
export const agentsLabel = (count: number) => `${count} agent${count > 1 ? 's' : ''}`;

/** « 312 agents inscrits sur 401 ». */
export const participantsLabel = (participants: number, agents: number) =>
  `${participants} agent${participants > 1 ? 's' : ''} inscrit${participants > 1 ? 's' : ''} sur ${agents}`;

/** « mis à jour à 9 h 12 ». */
export const updatedAtLabel = (date: Date) => `mis à jour à ${date.getHours()} h ${String(date.getMinutes()).padStart(2, '0')}`;
