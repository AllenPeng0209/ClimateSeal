/**
 * app/types/conversations.ts
 * Defines types related to conversation threads and messages within a workflow.
 */

/**
 * Represents a single message within a conversation thread.
 */
export interface ConversationMessage {
  messageId: string; // Unique ID for the message
  threadId: string; // ADDED: To link message to its thread
  speaker: 'user' | 'ai' | 'system'; // Added 'system' for system messages if needed
  text: string; // The content of the message
  timestamp: string; // ISO Timestamp of when the message was sent/created
  metadata?: Record<string, any>; // Optional metadata, e.g., related node IDs, feedback, etc.
}

/**
 * Represents a distinct conversation thread, which could be about a specific topic or a session.
 */
export interface ConversationThread {
  threadId: string; // Unique ID for this conversation thread
  workflowId: string; // Foreign key to the workflow this thread belongs to
  title?: string; // Optional title or summary for the conversation topic
  createdAt: string; // ISO Timestamp of when the thread was initiated
  lastUpdatedAt: string; // ISO Timestamp of the last message or update to the thread
  messages: ConversationMessage[]; // Array of messages in this thread
  // Optional: could add other context like entry point, or user who initiated if relevant
  // initiatedByUserId?: string;
}