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
  /**
   * Fields Postiz requires per platform beyond caption/media, which a
   * caption alone can't express — e.g. YouTube mandates a title (distinct
   * from the caption/description) and a visibility setting; Instagram
   * mandates whether this is a feed post or a Story. Only the block
   * matching `target.platform` is read. Facebook needs nothing extra —
   * every field on its Postiz settings DTO is optional.
   */
  youtube?: {
    title: string;
    visibility: "public" | "private" | "unlisted";
  };
  instagram?: {
    postType: "post" | "story";
  };
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
