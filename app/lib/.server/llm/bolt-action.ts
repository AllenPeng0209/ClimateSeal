import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('bolt-action');

export interface BoltAction {
  type: string;
  file?: File;
  [key: string]: any;
}

export function extractBoltAction(content: string): BoltAction | null {
  try {
    const match = content.match(/<boltAction\s+([^>]+)\/>/);
    if (!match) return null;
    
    const attrs: BoltAction = { type: '' };
    match[1].replace(/(\w+)="([^"]+)"/g, (_, key, value) => {
      attrs[key] = value;
      return '';
    });
    
    return attrs;
  } catch (error) {
    logger.error('Failed to extract BoltAction', { error, content });
    return null;
  }
}

export function extractBoltActions(content: string): BoltAction[] {
  const actions: BoltAction[] = [];
  const regex = /<bolt:([^>]+)>/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    try {
      const action = JSON.parse(match[1]);
      if (validateBoltAction(action)) {
        actions.push(action);
      }
    } catch (error) {
      console.error('Failed to parse BoltAction:', error);
    }
  }

  return actions;
}

export function validateBoltAction(action: any): action is BoltAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    typeof action.type === 'string'
  );
} 