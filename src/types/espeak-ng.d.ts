// Minimal types for the "espeak-ng" package (eSpeak NG compiled to WebAssembly),
// which ships without TypeScript definitions.
declare module "espeak-ng" {
  type EmscriptenFS = {
    writeFile(path: string, data: string | Uint8Array): void;
    readFile(path: string): Uint8Array;
  };
  type ESpeakModule = { FS: EmscriptenFS };
  type ESpeakOptions = {
    arguments: string[];
    preRun?: Array<(module: ESpeakModule) => void>;
    print?: (text: string) => void;
    printErr?: (text: string) => void;
  };
  /** Runs eSpeak once with the given command-line arguments. */
  const ESpeakNg: (options: ESpeakOptions) => Promise<ESpeakModule>;
  export default ESpeakNg;
}
