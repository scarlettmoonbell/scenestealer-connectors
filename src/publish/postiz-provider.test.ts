import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PostizPublishProvider } from "./postiz-provider.js";
import type { PublishRequest } from "./types.js";

describe("PostizPublishProvider", () => {
  const apiUrl = "https://postiz.example.internal";
  const apiKey = "test-api-key";
  let provider: PostizPublishProvider;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    provider = new PostizPublishProvider(apiUrl, apiKey);
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function jsonResponse(body: unknown, ok = true, status = 200) {
    return {
      ok,
      status,
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(JSON.stringify(body)),
    };
  }

  describe("publish", () => {
    const baseRequest: PublishRequest = {
      target: { platform: "youtube", integrationId: "integration-1" },
      fileUrl: "https://media.example.com/clip.mp4",
      caption: "Check out this clip!",
      youtube: { title: "Show-stopping moment", visibility: "public" },
    };

    it("uploads the file, builds YouTube settings, and returns the created post id", async () => {
      fetchMock
        .mockResolvedValueOnce(
          jsonResponse({ id: "media-1", path: "https://cdn/media-1.mp4" }),
        )
        .mockResolvedValueOnce(
          jsonResponse([{ postId: "post-1", integration: "integration-1" }]),
        );

      const result = await provider.publish(baseRequest);

      expect(result).toEqual({ externalPostId: "post-1", status: "scheduled" });

      expect(fetchMock).toHaveBeenCalledTimes(2);

      const [uploadUrl, uploadInit] = fetchMock.mock.calls[0]!;
      expect(uploadUrl).toBe(`${apiUrl}/public/v1/upload-from-url`);
      expect(uploadInit.method).toBe("POST");
      expect(uploadInit.headers.Authorization).toBe(apiKey);
      expect(JSON.parse(uploadInit.body)).toEqual({
        url: baseRequest.fileUrl,
      });

      const [postUrl, postInit] = fetchMock.mock.calls[1]!;
      expect(postUrl).toBe(`${apiUrl}/public/v1/posts`);
      const postBody = JSON.parse(postInit.body);
      expect(postBody.type).toBe("now");
      expect(postBody.shortLink).toBe(false);
      expect(postBody.tags).toEqual([]);
      expect(postBody.posts).toEqual([
        {
          integration: { id: "integration-1" },
          value: [
            {
              content: baseRequest.caption,
              image: [{ id: "media-1", path: "https://cdn/media-1.mp4" }],
            },
          ],
          settings: {
            __type: "youtube",
            title: "Show-stopping moment",
            type: "public",
          },
        },
      ]);
    });

    it("sends type 'schedule' with the given date when scheduledAt is set", async () => {
      const scheduledAt = new Date("2026-08-01T12:00:00.000Z");
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ id: "m", path: "p" }))
        .mockResolvedValueOnce(jsonResponse([{ postId: "post-1" }]));

      await provider.publish({ ...baseRequest, scheduledAt });

      const postBody = JSON.parse(fetchMock.mock.calls[1]![1].body);
      expect(postBody.type).toBe("schedule");
      expect(postBody.date).toBe(scheduledAt.toISOString());
    });

    it("builds Instagram settings from request.instagram", async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ id: "m", path: "p" }))
        .mockResolvedValueOnce(jsonResponse([{ postId: "post-1" }]));

      await provider.publish({
        target: { platform: "instagram", integrationId: "ig-1" },
        fileUrl: "https://media.example.com/clip.mp4",
        caption: "caption",
        instagram: { postType: "story" },
      });

      const postBody = JSON.parse(fetchMock.mock.calls[1]![1].body);
      expect(postBody.posts[0].settings).toEqual({
        __type: "instagram",
        post_type: "story",
      });
    });

    it("builds Facebook settings with only the discriminator", async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ id: "m", path: "p" }))
        .mockResolvedValueOnce(jsonResponse([{ postId: "post-1" }]));

      await provider.publish({
        target: { platform: "facebook", integrationId: "fb-1" },
        fileUrl: "https://media.example.com/clip.mp4",
        caption: "caption",
      });

      const postBody = JSON.parse(fetchMock.mock.calls[1]![1].body);
      expect(postBody.posts[0].settings).toEqual({ __type: "facebook" });
    });

    it("throws if target.platform is youtube but request.youtube is missing", async () => {
      await expect(
        provider.publish({
          target: { platform: "youtube", integrationId: "yt-1" },
          fileUrl: "https://media.example.com/clip.mp4",
          caption: "caption",
        }),
      ).rejects.toThrow(/PublishRequest.youtube is required/);

      // Should fail before ever calling the API.
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("throws if target.platform is instagram but request.instagram is missing", async () => {
      await expect(
        provider.publish({
          target: { platform: "instagram", integrationId: "ig-1" },
          fileUrl: "https://media.example.com/clip.mp4",
          caption: "caption",
        }),
      ).rejects.toThrow(/PublishRequest.instagram is required/);
    });

    it("throws with the response body when the upload call fails", async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ msg: "File is too large." }, false, 400),
      );

      await expect(provider.publish(baseRequest)).rejects.toThrow(
        /Postiz API POST \/upload-from-url failed: 400/,
      );
    });

    it("throws if Postiz returns an empty array from the create-post call", async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ id: "m", path: "p" }))
        .mockResolvedValueOnce(jsonResponse([]));

      await expect(provider.publish(baseRequest)).rejects.toThrow(
        "Postiz did not return a created post",
      );
    });
  });

  describe("getStatus", () => {
    it("maps PUBLISHED to status published", async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ posts: [{ id: "post-1", state: "PUBLISHED" }] }),
      );

      const result = await provider.getStatus("post-1");

      expect(result).toEqual({ externalPostId: "post-1", status: "published" });
    });

    it("maps ERROR to status failed with an error message", async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ posts: [{ id: "post-1", state: "ERROR" }] }),
      );

      const result = await provider.getStatus("post-1");

      expect(result.status).toBe("failed");
      expect(result.error).toBeTruthy();
    });

    it("maps QUEUE and DRAFT to status scheduled", async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ posts: [{ id: "post-1", state: "QUEUE" }] }),
      );
      expect((await provider.getStatus("post-1")).status).toBe("scheduled");

      fetchMock.mockResolvedValueOnce(
        jsonResponse({ posts: [{ id: "post-1", state: "DRAFT" }] }),
      );
      expect((await provider.getStatus("post-1")).status).toBe("scheduled");
    });

    it("returns status failed when the post isn't found in the lookup window", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ posts: [] }));

      const result = await provider.getStatus("missing-post");

      expect(result.status).toBe("failed");
      expect(result.error).toMatch(/not found/i);
    });

    it("requests a wide startDate/endDate window since there's no by-ID endpoint", async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ posts: [] }));

      await provider.getStatus("post-1");

      const [url] = fetchMock.mock.calls[0]!;
      expect(url).toMatch(
        /^https:\/\/postiz\.example\.internal\/public\/v1\/posts\?startDate=.+&endDate=.+$/,
      );
    });
  });
});
