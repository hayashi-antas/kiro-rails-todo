import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Create a proper mock Headers class
class MockHeaders {
  private headers: Map<string, string>

  constructor(init?: HeadersInit) {
    this.headers = new Map()
    if (init) {
      if (init instanceof Map) {
        this.headers = new Map(init)
      } else if (Array.isArray(init)) {
        init.forEach(([key, value]) => this.headers.set(key.toLowerCase(), value))
      } else if (typeof init === 'object') {
        Object.entries(init).forEach(([key, value]) => this.headers.set(key.toLowerCase(), value))
      }
    }
  }

  get(name: string): string | null {
    return this.headers.get(name.toLowerCase()) || null
  }

  has(name: string): boolean {
    return this.headers.has(name.toLowerCase())
  }

  set(name: string, value: string): void {
    this.headers.set(name.toLowerCase(), value)
  }

  append(name: string, value: string): void {
    const existing = this.headers.get(name.toLowerCase())
    if (existing) {
      this.headers.set(name.toLowerCase(), `${existing}, ${value}`)
    } else {
      this.headers.set(name.toLowerCase(), value)
    }
  }

  delete(name: string): void {
    this.headers.delete(name.toLowerCase())
  }

  forEach(callback: (value: string, key: string, parent: Headers) => void): void {
    this.headers.forEach((value, key) => callback(value, key, this as any))
  }

  *entries(): IterableIterator<[string, string]> {
    yield* this.headers.entries()
  }

  *keys(): IterableIterator<string> {
    yield* this.headers.keys()
  }

  *values(): IterableIterator<string> {
    yield* this.headers.values()
  }

  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries()
  }
}

// Helper function to create proper mock Response objects
function createMockResponse(options: {
  ok: boolean
  status?: number
  statusText?: string
  headers?: Record<string, string>
  json?: () => Promise<any>
  text?: () => Promise<string>
}): Response {
  const mockHeaders = new MockHeaders(options.headers || {})
  
  const response = {
    ok: options.ok,
    status: options.status || (options.ok ? 200 : 500),
    statusText: options.statusText || (options.ok ? 'OK' : 'Internal Server Error'),
    headers: mockHeaders,
    json: options.json || (() => Promise.resolve({})),
    text: options.text || (() => Promise.resolve('')),
    // Add other Response properties that might be needed
    url: '',
    redirected: false,
    type: 'basic' as ResponseType,
    body: null,
    bodyUsed: false,
    clone: vi.fn(() => response),
    arrayBuffer: vi.fn(() => Promise.resolve(new ArrayBuffer(0))),
    blob: vi.fn(() => Promise.resolve(new Blob())),
    formData: vi.fn(() => Promise.resolve(new FormData())),
  } as Response

  return response
}

// Make the helper available globally for tests
(global as any).createMockResponse = createMockResponse

// Mock WebAuthn API for testing
Object.defineProperty(global, 'navigator', {
  value: {
    credentials: {
      create: vi.fn(),
      get: vi.fn(),
    },
    userAgent: 'test',
  },
  writable: true,
})

// Mock fetch for API calls
global.fetch = vi.fn()

// Make the original mock available for tests
;(global as any).mockFetch = global.fetch

// Mock Headers constructor
global.Headers = MockHeaders as any

// Mock btoa/atob for base64 encoding/decoding
global.btoa = vi.fn((str: string) => Buffer.from(str, 'binary').toString('base64'))
global.atob = vi.fn((str: string) => Buffer.from(str, 'base64').toString('binary'))

// Mock DOM methods that might be missing in jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
  },
  writable: true,
})