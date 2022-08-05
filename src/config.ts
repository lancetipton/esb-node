import fs from 'fs'
import type { BuildOptions } from "esbuild";



export type Config = Partial<{
  outDir: string;
  clean?: boolean;
  tsConfigFile?: string;
  esbuild: BuildOptions;
  assets: {
    baseDir?: string;
    outDir?: string;
    filePatterns?: string[];
  };
}>;

export async function readUserConfig(configPath: string): Promise<Config | undefined> {
  if (fs.existsSync(configPath)) {
    try {
      return require(configPath);
    }
    catch (e) {
      console.log("Config file has some errors:");
      console.error(e);
    }
  }

  return undefined;
}
