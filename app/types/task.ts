// app/types/task.ts

export interface Task {
  id: string;
  description: string;
  status: 'pending' | 'completed';
  createdAt: string; // ISO string for date
  updatedAt: string; // ISO string for date
  // Optional fields you might consider later:
  // assignedTo?: string;
  // dueDate?: string;
  // priority?: 'low' | 'medium' | 'high';
}
