export type StoredObject = {
  publicPath: string;
  absolutePath: string;
};

export interface MediaStoragePort {
  save(buffer: Buffer, options: {
    safeName: string;
    mime: string;
    subdir?: string;
  }): Promise<StoredObject>;

  delete(publicPath: string): Promise<boolean>;

  exists(publicPath: string): boolean;
}
