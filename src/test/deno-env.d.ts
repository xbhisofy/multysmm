/** Minimal runtime declaration for payment helpers imported by unit tests. */
declare const Deno: {
  env: { get(name: string): string | undefined };
};