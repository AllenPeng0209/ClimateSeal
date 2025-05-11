export interface FileMap {
  [key: string]: {
    type: 'file';
    content: string;
    isBinary: boolean;
  };
}

export interface UploadFileResponse {
  success: boolean;
  error?: string;
  fileMetadata: {
    id: string;
    path: string;
  };
} 