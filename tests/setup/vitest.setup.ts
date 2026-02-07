import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, vi } from "vitest";

class ResizeObserverMock {
  observe() {}

  unobserve() {}

  disconnect() {}
}

const createMatchMediaMock = () => {
  return vi.fn().mockImplementation((query: string) => {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  });
};

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: createMatchMediaMock(),
  });

  Object.defineProperty(window, "ResizeObserver", {
    configurable: true,
    writable: true,
    value: ResizeObserverMock,
  });

  Object.defineProperty(globalThis, "ResizeObserver", {
    configurable: true,
    writable: true,
    value: ResizeObserverMock,
  });

  if (typeof window.scrollTo !== "function") {
    Object.defineProperty(window, "scrollTo", {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
  }

  if (typeof HTMLElement !== "undefined") {
    if (typeof HTMLElement.prototype.scrollIntoView !== "function") {
      Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
        configurable: true,
        writable: true,
        value: vi.fn(),
      });
    }
  }
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
