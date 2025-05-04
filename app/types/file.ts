export interface FileMap {
  [key: string]: {
    type: 'file';
    content: string;
    isBinary: boolean;
  };
} 