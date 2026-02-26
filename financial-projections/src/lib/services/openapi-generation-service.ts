import fs from 'fs/promises';
import path from 'path';

const SPEC_DIR = path.join(process.cwd(), 'data', 'openapi');
const SPEC_FILE_PREFIX = 'openapi-spec-v';
const SPEC_FILE_EXTENSION = '.json';

export type GenerationState = 'idle' | 'generating' | 'complete' | 'failed';

export type GenerationStatus = {
  state: GenerationState;
  currentVersion: number | null;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
};

/**
 * OpenAPI Generation Service (Singleton)
 *
 * Manages versioned OpenAPI spec files on disk and tracks
 * fire-and-forget generation status in memory.
 *
 * Spec files are written to data/openapi/openapi-spec-v{N}.json.
 * The service never blocks on generation — callers kick off generation
 * and poll status separately.
 */
class OpenApiGenerationService {
  private static instance: OpenApiGenerationService;

  private status: GenerationStatus = {
    state: 'idle',
    currentVersion: null,
    startedAt: null,
    completedAt: null,
    error: null,
  };

  private initialized = false;

  private constructor() {}

  public static getInstance(): OpenApiGenerationService {
    if (!OpenApiGenerationService.instance) {
      OpenApiGenerationService.instance = new OpenApiGenerationService();
    }
    return OpenApiGenerationService.instance;
  }

  // --- Directory & version helpers ---

  private async ensureSpecDir(): Promise<void> {
    try {
      await fs.access(SPEC_DIR);
    } catch {
      await fs.mkdir(SPEC_DIR, { recursive: true });
    }
  }

  /**
   * Scan the spec directory for the highest version number.
   * Returns 0 if no specs exist.
   */
  private async getHighestVersion(): Promise<number> {
    try {
      const files = await fs.readdir(SPEC_DIR);
      let max = 0;
      for (const file of files) {
        if (file.startsWith(SPEC_FILE_PREFIX) && file.endsWith(SPEC_FILE_EXTENSION)) {
          const versionStr = file.slice(SPEC_FILE_PREFIX.length, -SPEC_FILE_EXTENSION.length);
          const version = parseInt(versionStr, 10);
          if (!isNaN(version) && version > max) {
            max = version;
          }
        }
      }
      return max;
    } catch {
      // Directory doesn't exist yet
      return 0;
    }
  }

  private specFilePath(version: number): string {
    return path.join(SPEC_DIR, `${SPEC_FILE_PREFIX}${version}${SPEC_FILE_EXTENSION}`);
  }

  // --- Lazy init ---

  /**
   * On first access, detect the current version from disk
   * so we don't report idle when a spec already exists.
   */
  private async lazyInit(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    const version = await this.getHighestVersion();
    if (version > 0) {
      this.status.currentVersion = version;
      this.status.state = 'complete';
    }
  }

  // --- Public API ---

  /**
   * Get the current generation status.
   */
  public async getStatus(): Promise<GenerationStatus> {
    await this.lazyInit();
    return { ...this.status };
  }

  /**
   * Read the latest spec from disk.
   * Returns null if no spec file exists.
   */
  public async readLatestSpec(): Promise<Record<string, unknown> | null> {
    await this.lazyInit();

    const version = await this.getHighestVersion();
    if (version === 0) return null;

    try {
      const content = await fs.readFile(this.specFilePath(version), 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      console.error('[OpenAPI] Failed to read spec file:', err);
      return null;
    }
  }

  /**
   * Start a fire-and-forget generation run.
   * Returns true if generation was started, false if already running.
   */
  public async startGeneration(): Promise<boolean> {
    await this.lazyInit();

    if (this.status.state === 'generating') {
      return false;
    }

    this.status.state = 'generating';
    this.status.startedAt = new Date().toISOString();
    this.status.completedAt = null;
    this.status.error = null;

    // Fire and forget — do NOT await
    this.runGeneration().catch((err) => {
      console.error('[OpenAPI] Unhandled generation error:', err);
    });

    return true;
  }

  private async runGeneration(): Promise<void> {
    try {
      console.log('[OpenAPI] Generation started...');
      const startTime = Date.now();

      // Dynamic imports to keep the service module lightweight.
      // generateOpenApiSpec does the heavy work (reads/transpiles/evals all route files).
      const [{ default: generateOpenApiSpec }, { getCleanedSchemaMap, OPENAPI_CONFIG }] =
        await Promise.all([
          import('@omer-x/next-openapi-json-generator'),
          import('@/lib/openapi-spec-schemas'),
        ]);

      const spec = await generateOpenApiSpec(getCleanedSchemaMap(), OPENAPI_CONFIG);

      // Write to next version
      await this.ensureSpecDir();
      const nextVersion = (await this.getHighestVersion()) + 1;
      const filePath = this.specFilePath(nextVersion);
      await fs.writeFile(filePath, JSON.stringify(spec, null, 2), 'utf-8');

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[OpenAPI] Generation complete → v${nextVersion} (${elapsed}s)`);

      this.status.state = 'complete';
      this.status.currentVersion = nextVersion;
      this.status.completedAt = new Date().toISOString();
      this.status.error = null;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[OpenAPI] Generation failed:', message);

      this.status.state = 'failed';
      this.status.completedAt = new Date().toISOString();
      this.status.error = message;
    }
  }
}

export const openApiGenerationService = OpenApiGenerationService.getInstance();
