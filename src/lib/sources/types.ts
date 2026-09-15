import type { Product, SearchParams } from "@/lib/types";

/**
 * ProductSource adapter contract. Each source keeps its request builders and
 * response parsers pure (unit-testable with fixtures); `search` is the only
 * I/O boundary and receives fetch + env injected so tests can stub both.
 */
export interface SourceContext {
  fetchFn: typeof fetch;
  env: Record<string, string | undefined>;
}

export interface ProductSource {
  id: string;
  label: string;
  /** true when the env has the credentials this source needs */
  isConfigured(env: SourceContext["env"]): boolean;
  search(params: SearchParams, ctx: SourceContext): Promise<Product[]>;
}
