import 'next';

declare module 'next' {
  // Override the PageProps type for dynamic routes
  export interface PageProps {
    params?: Record<string, string>;
    searchParams?: { [key: string]: string | string[] | undefined };
  }
}

// This tells TypeScript to treat this file as a module
export {};
