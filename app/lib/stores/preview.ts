import { atom } from 'nanostores';
import type { UploadFile } from 'antd/es/upload/interface';

export interface PreviewState {
  files: UploadFile<any>[];
  imageDataList: string[];
  activeFileIndex: number;
}

const initialState: PreviewState = {
  files: [],
  imageDataList: [],
  activeFileIndex: -1,
};

export const previewStore = atom<PreviewState>(initialState);

export const previewActions = {
  setFiles: (files: UploadFile<any>[]) => {
    previewStore.set({
      ...previewStore.get(),
      files,
    });
  },

  setImageDataList: (imageDataList: string[]) => {
    previewStore.set({
      ...previewStore.get(),
      imageDataList,
    });
  },

  setActiveFileIndex: (index: number) => {
    previewStore.set({
      ...previewStore.get(),
      activeFileIndex: index,
    });
  },

  addFiles: (newFiles: UploadFile<any>[], newImageDataList: string[]) => {
    const currentState = previewStore.get();
    previewStore.set({
      ...currentState,
      files: [...currentState.files, ...newFiles],
      imageDataList: [...currentState.imageDataList, ...newImageDataList],
    });
  },

  removeFile: (index: number) => {
    const currentState = previewStore.get();
    const newFiles = [...currentState.files];
    const newImageDataList = [...currentState.imageDataList];
    
    newFiles.splice(index, 1);
    newImageDataList.splice(index, 1);
    
    previewStore.set({
      ...currentState,
      files: newFiles,
      imageDataList: newImageDataList,
      activeFileIndex: index >= newFiles.length ? newFiles.length - 1 : currentState.activeFileIndex,
    });
  },

  reset: () => {
    previewStore.set(initialState);
  },
}; 