// Minimal NativeWind ambient types to satisfy TypeScript
// This file is intentionally minimal — extend if your project uses additional NativeWind features

declare module 'nativewind' {
  import { ComponentType } from 'react';
  const styled: <P = any>(
    component: ComponentType<P>
  ) => ComponentType<P & { className?: string }>;
  export { styled };
}

declare global {
  // Allow `tw` function if used elsewhere in the project
  function tw(strings: TemplateStringsArray, ...args: any[]): string;
}

export {};
