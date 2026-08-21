import type { PublishProvider, PublishRequest, PublishResult } from "./types.js";
/**
 * Calls a self-hosted Postiz instance's public API over the network — this
 * class is a client, never a fork or vendored copy of Postiz's own
 * (AGPL-3.0) source. See ../../README.md's "Open-source building blocks"
 * section for why that boundary matters.
 *
 * Request/response shapes below are confirmed against Postiz's actual
 * source (github.com/gitroomhq/postiz-app) — its own public API docs are
 * incomplete for the create-post response and provider settings shapes
 * (acknowledged by the project's own maintainers in
 * github.com/gitroomhq/postiz-app/issues/717).
 */
export declare class PostizPublishProvider implements PublishProvider {
    private readonly postizApiUrl;
    private readonly postizApiKey;
    constructor(postizApiUrl: string, postizApiKey: string);
    private request;
    publish(request: PublishRequest): Promise<PublishResult>;
    getStatus(externalPostId: string): Promise<PublishResult>;
}
