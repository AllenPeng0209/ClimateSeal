export interface Comment {
  commentId: string;
  workflowId?: string;
  targetType: 'node' | 'edge' | 'global';
  targetId?: string; // ID of the node or edge if targetType is not 'global'
  text: string;
  userId: string;
  timestamp: string;
  position?: { x: number; y: number }; // For positioning comment markers on the canvas
  parentCommentId?: string;
  replies?: Comment[]; // Nested replies
  createdAt?: string;
  updatedAt?: string;
} 