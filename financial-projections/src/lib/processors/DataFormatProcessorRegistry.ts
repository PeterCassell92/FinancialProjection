import { DataFormatProcessor } from './DataFormatProcessor';
import { HalifaxCSVProcessor } from './HalifaxCSVProcessor';

/**
 * Registry for all data format processors
 * Provides centralized access to processors by format ID
 */
class DataFormatProcessorRegistry {
  private processors: Map<string, DataFormatProcessor>;

  constructor() {
    this.processors = new Map();
    this.registerDefaults();
  }

  /**
   * Register all default/built-in processors
   */
  private registerDefaults(): void {
    this.register(new HalifaxCSVProcessor());
    // Add more processors here as they are implemented:
    // this.register(new BarclaysCSVProcessor());
    // this.register(new NatwestCSVProcessor());
  }

  /**
   * Register a new processor
   */
  register(processor: DataFormatProcessor): void {
    if (this.processors.has(processor.formatId)) {
      console.warn(
        `Processor for format "${processor.formatId}" is being overwritten`
      );
    }
    this.processors.set(processor.formatId, processor);
  }

  /**
   * Get a processor by format ID
   * @param formatId The data format identifier (e.g., "halifax_csv_v1")
   * @returns The processor instance or undefined if not found
   */
  getProcessor(formatId: string): DataFormatProcessor | undefined {
    return this.processors.get(formatId);
  }

  /**
   * Check if a processor exists for a given format
   */
  hasProcessor(formatId: string): boolean {
    return this.processors.has(formatId);
  }

  /**
   * Get all registered format IDs
   */
  getSupportedFormats(): string[] {
    return Array.from(this.processors.keys());
  }

  /**
   * Get all registered processors
   */
  getAllProcessors(): DataFormatProcessor[] {
    return Array.from(this.processors.values());
  }
}

// Export singleton instance
export const processorRegistry = new DataFormatProcessorRegistry();
