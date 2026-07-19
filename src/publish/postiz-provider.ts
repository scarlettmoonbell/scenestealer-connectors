import type {
  PublishProvider,
  PublishRequest,
  PublishResult,
} from "./types.js";

/**
 * Calls a self-hosted Postiz instance's API over the network — this class
 * is a client, never a fork or vendored copy of Postiz's own (AGPL-3.0)
 * source. See ../../README.md's "Open-source building blocks" section for
 * why that boundary matters.
 *
 * Not implemented yet — this is the Phase 1 scaffold. See README.md's
 * "Status" section for what's real vs. stubbed.
 */
export class PostizPublishProvider implements PublishProvider {
  constructor(
    private readonly postizApiUrl: string,
    private readonly postizApiKey: string,
  ) {}

  async publish(_request: PublishRequest): Promise<PublishResult> {
    throw new Error("not implemented — see README.md Status section");
  }

  async getStatus(_externalPostId: string): Promise<PublishResult> {
    throw new Error("not implemented — see README.md Status section");
  }
}
