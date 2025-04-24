import { map } from 'nanostores';

export const chatStore = map({
  started: true,
  aborted: false,
  showChat: true,
});
