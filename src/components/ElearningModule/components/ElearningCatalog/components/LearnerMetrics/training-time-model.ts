/** The agent's training time of a year, as `GET /elearning/training-time` gives it (MAIR-1144). */
export interface ElearningTrainingTimeCourse {
  id: string;
  title: string;
  status: 'not-started' | 'in-progress' | 'completed';
  timeSpentSeconds: number;
  completedAt: string | null;
}

export interface ElearningTrainingTime {
  year: number;
  goalMinutes: number;
  timeSpentSeconds: number;
  completedCount: number;
  courses: ElearningTrainingTimeCourse[];
}
