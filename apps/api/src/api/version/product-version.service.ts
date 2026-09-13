import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Injectable } from '@nestjs/common';
import { env } from '@/config/env';
import { normalizeReleaseVersion } from './release-version';

export interface ProductBuildIdentity {
  version: string;
  gitSha: string;
  buildId: string;
  versionFileSha: string | null;
}

/** Reads the repository-owned version and deployment-provided build identity. */
@Injectable()
export class ProductVersionService {
  private readonly identity: ProductBuildIdentity;

  constructor() {
    this.identity = this.loadIdentity();
  }

  getIdentity(): ProductBuildIdentity {
    return this.identity;
  }

  private loadIdentity(): ProductBuildIdentity {
    const versionFilePath = join(process.cwd(), 'release', 'version.json');
    let versionFromFile: string | undefined;
    let versionFileSha: string | null = null;

    if (existsSync(versionFilePath)) {
      const bytes = readFileSync(versionFilePath);
      versionFileSha = createHash('sha256').update(bytes).digest('hex');
      const parsed = JSON.parse(bytes.toString('utf8')) as {
        version?: unknown;
      };
      if (typeof parsed.version === 'string') versionFromFile = parsed.version;
    }

    const version = normalizeReleaseVersion(
      env.APP_VERSION?.trim() || versionFromFile || '0.9.1-beta.1',
    );
    const gitSha = env.GIT_SHA?.trim() || 'unknown';
    const buildId = env.BUILD_ID?.trim() || `${version}:${gitSha}`;

    return { version, gitSha, buildId, versionFileSha };
  }
}
