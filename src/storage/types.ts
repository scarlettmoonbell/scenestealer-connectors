/** A file discovered on a tenant's connected storage remote, not yet downloaded. */
export interface RemoteFile {
  id: string;
  name: string;
  path: string;
  size: number;
  modifiedAt: Date;
  mimeType?: string;
}

/** OAuth-consent providers: Google Drive, Dropbox, OneDrive/SharePoint, Box. */
export interface OAuthStorageConfig {
  kind: "oauth";
  provider: "google-drive" | "dropbox" | "onedrive" | "box";
  accessToken: string;
  refreshToken: string;
  folderId: string;
}

/** Credential-based object storage: AWS S3, Azure Blob, Google Cloud Storage. */
export interface CredentialStorageConfig {
  kind: "credential";
  provider: "s3" | "azure-blob" | "gcs";
  bucket: string;
  prefix?: string;
  credentials: Record<string, string>;
}

export type StorageConfig = OAuthStorageConfig | CredentialStorageConfig;

/**
 * Implemented once, backed by rclone's RC API — see ../../README.md for why.
 * Each StorageConfig maps to one rclone remote; this interface is the typed
 * wrapper the rest of SceneStealer depends on, not a per-provider SDK client.
 */
export interface StorageProvider {
  listNewFiles(config: StorageConfig, since?: Date): Promise<RemoteFile[]>;
  download(config: StorageConfig, file: RemoteFile, destPath: string): Promise<void>;
  refreshToken?(config: OAuthStorageConfig): Promise<{ accessToken: string; expiresAt: Date }>;
}
