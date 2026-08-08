import type {
  PublishProvider,
  PublishRequest,
  PublishResult,
} from "./types.js";

/**
 * Postiz-side media descriptor returned by /public/v1/upload-from-url —
 * shape confirmed against Postiz's own MediaRepository.saveFile source
 * (id/name/originalName/path/thumbnail/alt), not guessed from docs, which
 * don't fully document this endpoint's response.
 */
interface PostizMedia {
  id: string;
  path: string;
}

/** Postiz's Post.state enum — confirmed against its own Prisma schema via
 * the GET /posts response shape. */
type PostizPostState = "QUEUE" | "PUBLISHED" | "ERROR" | "DRAFT";

interface PostizPost {
  id: string;
  state: PostizPostState;
  releaseURL?: string;
}

function mapState(state: PostizPostState): PublishResult["status"] {
  switch (state) {
    case "PUBLISHED":
      return "published";
    case "ERROR":
      return "failed";
    default:
      // QUEUE and DRAFT are both non-terminal — "scheduled" is the closest
      // fit in our 3-value status union.
      return "scheduled";
  }
}

/**
 * Builds the `settings` object Postiz's CreatePostDto requires per
 * platform. Field names and requiredness confirmed against Postiz's own
 * provider-settings DTOs (youtube.settings.dto.ts, instagram.dto.ts,
 * facebook.dto.ts) on GitHub, not from docs — the public API docs don't
 * fully cover this shape.
 */
function buildSettings(request: PublishRequest): Record<string, unknown> {
  switch (request.target.platform) {
    case "youtube": {
      if (!request.youtube) {
        throw new Error(
          "PublishRequest.youtube is required when target.platform is 'youtube' — Postiz's YouTube settings DTO mandates a title and visibility that can't be derived from caption alone",
        );
      }
      return {
        __type: "youtube",
        title: request.youtube.title,
        type: request.youtube.visibility,
      };
    }
    case "instagram": {
      if (!request.instagram) {
        throw new Error(
          "PublishRequest.instagram is required when target.platform is 'instagram' — Postiz's Instagram settings DTO mandates post_type",
        );
      }
      return {
        __type: "instagram",
        post_type: request.instagram.postType,
      };
    }
    case "facebook":
      // Every field on Postiz's Facebook settings DTO is optional.
      return { __type: "facebook" };
  }
}

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
export class PostizPublishProvider implements PublishProvider {
  constructor(
    private readonly postizApiUrl: string,
    private readonly postizApiKey: string,
  ) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.postizApiUrl}/public/v1${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        // Raw API key, no "Bearer " prefix — confirmed against Postiz's
        // own official SDK (apps/sdk/src/index.ts).
        Authorization: this.postizApiKey,
        ...init?.headers,
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `Postiz API ${init?.method ?? "GET"} ${path} failed: ${res.status} ${body}`,
      );
    }
    return res.json() as Promise<T>;
  }

  async publish(request: PublishRequest): Promise<PublishResult> {
    // Validate before any network call — fail fast on bad input instead of
    // uploading media we're about to discard.
    const settings = buildSettings(request);

    // Postiz fetches this URL server-side (SSRF-guarded, must be public
    // HTTPS — see its UploadDto validator) rather than us uploading the
    // file's bytes directly, since our video already lives at a public R2
    // URL.
    const media = await this.request<PostizMedia>("/upload-from-url", {
      method: "POST",
      body: JSON.stringify({ url: request.fileUrl }),
    });

    const result = await this.request<
      { postId: string; integration: string }[]
    >("/posts", {
      method: "POST",
      body: JSON.stringify({
        type: request.scheduledAt ? "schedule" : "now",
        date: (request.scheduledAt ?? new Date()).toISOString(),
        shortLink: false,
        tags: [],
        posts: [
          {
            integration: { id: request.target.integrationId },
            value: [
              {
                content: request.caption,
                image: [{ id: media.id, path: media.path }],
              },
            ],
            settings,
          },
        ],
      }),
    });

    const created = result[0];
    if (!created) {
      // Postiz's own createPost returns [] on certain validation failures
      // instead of throwing — see its PostsService.createPost source.
      throw new Error("Postiz did not return a created post");
    }

    return {
      externalPostId: created.postId,
      // Postiz processes the actual platform publish asynchronously via
      // its own workflow engine regardless of type "now" vs "schedule" —
      // this is never "published" synchronously. Poll getStatus for the
      // real outcome.
      status: "scheduled",
    };
  }

  async getStatus(externalPostId: string): Promise<PublishResult> {
    // Postiz's public API has no single-post-by-ID GET endpoint (confirmed
    // against its actual controller source, not just absent from docs) —
    // only a date-range list. Window wide enough to catch any post
    // regardless of how far it was scheduled out.
    const now = new Date();
    const startDate = new Date(now);
    startDate.setFullYear(startDate.getFullYear() - 1);
    const endDate = new Date(now);
    endDate.setFullYear(endDate.getFullYear() + 1);

    const { posts } = await this.request<{ posts: PostizPost[] }>(
      `/posts?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
    );

    const post = posts.find((p) => p.id === externalPostId);
    if (!post) {
      return {
        externalPostId,
        status: "failed",
        error: "Post not found in Postiz within the lookup window",
      };
    }

    return {
      externalPostId,
      status: mapState(post.state),
      error:
        post.state === "ERROR" ? "Postiz reported a publish error" : undefined,
    };
  }
}
