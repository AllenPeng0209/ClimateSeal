export interface SharedUser {
  userId: string;
  role: 'viewer' | 'editor' | 'commenter' | 'owner';
} 