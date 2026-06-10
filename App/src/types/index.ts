export enum TaskStatus {
  Open = "open",
  InProgress = "inProgress",
  Completed = "completed",
  Disputed = "disputed",
  Cancelled = "cancelled",
}

export interface NexumTask {
  taskId: string;
  creator: string;
  title: string;
  description: string;
  requiredSkills: string[];
  rewardLamports: number;
  deadlineUnix: number;
  status: TaskStatus;
  worker: string | null;
}

export interface UserProfile {
  owner: string;
  username: string;
  skills: string[];
  reputation: number;
  tasksCompleted: number;
  tasksCreated: number;
  sbtLevel: number;
}
