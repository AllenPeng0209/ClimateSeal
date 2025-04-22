import { atom } from 'nanostores';
import type { Message } from 'ai';

// Atom to hold the array of chat messages
export const chatMessagesStore = atom<Message[]>([]);

// Optional: Add helper functions if needed
// export function addChatMessage(message: Message) {
//   chatMessagesStore.set([...chatMessagesStore.get(), message]);
// }

// export function setChatMessages(messages: Message[]) {
//   chatMessagesStore.set(messages);
// } 