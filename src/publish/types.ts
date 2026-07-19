export interface PublishTarget {
  platform: "youtube" | "instagram" | "facebook";
  /** The Postiz-side integration ID for this tenant's connected account. */
  integrationId: string;
}

export interface PublishRequest {
  target: PublishTarget;
  fileUrl: string;
  caption: string;
  scheduledAt?: Date;
}

export interface PublishResult {
  externalPostId: string;
  status: "scheduled" | "published" | "failed";
  error?: string;
}

/**
 * Typed client for a self-hosted Postiz instance — see ../../README.md for
 * why publishing goes through Postiz rather than hand-rolled YouTube/Meta
 * API clients, and why that keeps this package's MIT license unaffected by
 * Postiz's own AGPL-3.0.
 */
export interface PublishProvider {
  publish(request: PublishRequest): Promise<PublishResult>;
  getStatus(externalPostId: string): Promise<PublishResult>;
}
