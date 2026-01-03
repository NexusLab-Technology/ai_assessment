/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

// This file provides Jest type definitions for TypeScript
// Jest globals are injected at runtime, so we need to declare them
declare global {
  // Jest globals
  const describe: jest.Describe;
  const it: jest.It;
  const test: jest.It;
  const beforeEach: jest.Lifecycle;
  const afterEach: jest.Lifecycle;
  const beforeAll: jest.Lifecycle;
  const afterAll: jest.Lifecycle;
  const expect: jest.Expect;
  
  // Jest namespace
  namespace jest {
    interface Describe {
      (name: string, fn: () => void): void;
      only: (name: string, fn: () => void) => void;
      skip: (name: string, fn: () => void) => void;
    }
    
    interface It {
      (name: string, fn?: () => void | Promise<void>): void;
      only: (name: string, fn?: () => void | Promise<void>) => void;
      skip: (name: string, fn?: () => void | Promise<void>) => void;
    }
    
    interface Lifecycle {
      (fn: () => void | Promise<void>): void;
    }
    
    interface Expect {
      <T = any>(actual: T): jest.Matchers<void, T>;
      objectContaining(object: Record<string, any>): any;
      stringContaining(value: string): any;
      arrayContaining(sample: Array<any>): any;
      anything(): any;
      any(constructor: any): any;
    }

    interface Matchers<R, T = {}> {
      toBeInTheDocument(): R;
      toHaveTextContent(text: string | RegExp): R;
      toHaveClass(className: string): R;
      toHaveAttribute(attr: string, value?: string): R;
      toBeVisible(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toHaveValue(value: string | number): R;
      toHaveLength(length: number): R;
      toContain(item: any): R;
      toBeGreaterThan(number: number): R;
      toBeLessThan(number: number): R;
      toBeLessThanOrEqual(number: number): R;
      toBeGreaterThanOrEqual(number: number): R;
      toHaveBeenCalled(): R;
      toHaveBeenCalledWith(...args: any[]): R;
      toHaveBeenCalledTimes(times: number): R;
      toBe(expected: any): R;
      toEqual(expected: any): R;
      toBeTruthy(): R;
      toBeFalsy(): R;
      toBeDefined(): R;
      toBeUndefined(): R;
      toBeNull(): R;
      not: Matchers<R, T>;
    }
    
    interface Mock<T = any, Y extends any[] = any> {
      (...args: Y): T;
      mockImplementation(fn?: (...args: Y) => T): this;
      mockReturnValue(value: T): this;
      mockReturnValueOnce(value: T): this;
      mockResolvedValue(value: T): this;
      mockRejectedValue(value: any): this;
      mockClear(): this;
      mockReset(): this;
      mockRestore(): void;
    }
    
    function fn<T extends (...args: any[]) => any>(implementation?: T): Mock<ReturnType<T>, Parameters<T>>;
    function clearAllMocks(): void;
    function resetAllMocks(): void;
    function restoreAllMocks(): void;
  }
}

export {};