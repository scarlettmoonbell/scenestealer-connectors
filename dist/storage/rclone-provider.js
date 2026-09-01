/**
 * Drives a self-hosted `rclone rcd` instance over its Remote Control (RC)
 * HTTP API rather than shelling out to the CLI per call. One rclone remote
 * per tenant StorageConnection; remote config is generated from
 * StorageConfig, not stored in rclone's own config file, so nothing here
 * assumes a shared filesystem between worker instances.
 *
 * Not implemented yet — this is the Phase 1 scaffold. See README.md's
 * "Status" section for what's real vs. stubbed.
 */
export class RcloneStorageProvider {
  rcloneRcUrl;
  constructor(rcloneRcUrl) {
    this.rcloneRcUrl = rcloneRcUrl;
  }
  async listNewFiles(_config, _since) {
    throw new Error("not implemented — see README.md Status section");
  }
  async download(_config, _file, _destPath) {
    throw new Error("not implemented — see README.md Status section");
  }
}
