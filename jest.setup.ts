import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock Next.js server components
jest.mock('next/server', () => {
  class MockHeaders extends Map<string, string> {
    constructor(init?: Record<string, string> | [string, string][]) {
      super();
      if (init) {
        const entries = Array.isArray(init) ? init : Object.entries(init);
        entries.forEach(([key, value]) => this.set(key.toLowerCase(), value));
      }
    }

    // @ts-expect-error - Headers.get returns string | null, Map.get returns string | undefined
    get(name: string): string | null {
      return super.get(name.toLowerCase()) || null;
    }

    set(name: string, value: string): this {
      return super.set(name.toLowerCase(), value);
    }

    has(name: string): boolean {
      return super.has(name.toLowerCase());
    }

    delete(name: string): boolean {
      return super.delete(name.toLowerCase());
    }
  }

  class MockNextResponse {
    status: number;
    statusText: string | undefined;
    headers: MockHeaders;
    body: unknown;

    constructor(body?: unknown, init?: { status?: number; statusText?: string; headers?: Record<string, string> }) {
      this.status = init?.status || 200;
      this.statusText = init?.statusText;
      this.headers = new MockHeaders(init?.headers);
      this.body = body;
    }

    static json(data: unknown, init?: { status?: number; headers?: Record<string, string> }): MockNextResponse {
      const response = new MockNextResponse(JSON.stringify(data), init);
      response.headers.set('content-type', 'application/json');
      return response;
    }

    async json(): Promise<unknown> {
      if (typeof this.body === 'string') {
        return JSON.parse(this.body);
      }
      return this.body;
    }
  }

  class MockNextRequest {
    url: string;
    method: string;
    headers: MockHeaders;
    private bodyContent: string | null;

    constructor(url: string, init?: { method?: string; headers?: Record<string, string> | [string, string][]; body?: string | null }) {
      this.url = url;
      this.method = init?.method || 'GET';
      this.headers = new MockHeaders(init?.headers);
      this.bodyContent = init?.body || null;
    }

    async json(): Promise<unknown> {
      if (!this.bodyContent) {
        throw new Error('Body is empty');
      }
      try {
        return JSON.parse(this.bodyContent);
      } catch (error) {
        throw new Error('Invalid JSON');
      }
    }

    async text(): Promise<string> {
      return this.bodyContent || '';
    }
  }

  return {
    NextResponse: MockNextResponse,
    NextRequest: MockNextRequest,
  };
});

// Browser-only mocks (only run in jsdom environment)
if (typeof window !== 'undefined') {
  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Mock matchMedia for theme detection
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}
