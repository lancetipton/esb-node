#!/usr/bin/env node

import ts from "typescript";
import type { BuildOptions } from "esbuild";
import { build } from "esbuild";
import cpy from "cpy";
import path from "path";
import rimraf from "rimraf";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { Config, readUserConfig } from "./config.js";

const cwd = process.cwd();
const { argv } = yargs(hideBin(process.argv))
  .option("config", {
    describe: "path to config file",
    type: "string",
  })
  .option("clean", {
    describe: "clean output directory before build",
    type: "boolean",
  });

function getTSConfig(_tsConfigFile = "tsconfig.json") {
  const tsConfigFile = ts.findConfigFile(cwd, ts.sys.fileExists, _tsConfigFile);
  if (!tsConfigFile) {
    throw new Error(`tsconfig.json not found in the current directory! ${cwd}`);
  }
  const configFile = ts.readConfigFile(tsConfigFile, ts.sys.readFile);
  const tsConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    cwd
  );
  return { tsConfig, tsConfigFile };
}

type TSConfig = ReturnType<typeof getTSConfig>["tsConfig"];

function esBuildSourceMapOptions(tsConfig: TSConfig) {
  const { sourceMap, inlineSources, inlineSourceMap } = tsConfig.options;

  // inlineSources requires either inlineSourceMap or sourceMap
  if (inlineSources && !inlineSourceMap && !sourceMap) {
    return false;
  }

  // Mutually exclusive in tsconfig
  if (sourceMap && inlineSourceMap) {
    return false;
  }

  if (inlineSourceMap) {
    return "inline";
  }

  return sourceMap;
}

function getBuildMetadata(userConfig: Config) {
  const { tsConfig, tsConfigFile } = getTSConfig(userConfig.tsConfigFile);

  const outDir = userConfig.outDir || tsConfig.options.outDir || "dist";

  const {
    plugins=[],
    format=`cjs`,
    minify=false,
    entryPoints=[],
    target:esTarget,
    ...esBuildOpts
  } = (userConfig.esbuild || {}) as BuildOptions

  const srcFiles = [...tsConfig.fileNames, ...(entryPoints  as string[])];
  const sourcemap = esBuildSourceMapOptions(tsConfig);
  const target = esTarget || tsConfig?.raw?.compilerOptions?.target || "es6";

  const esbuildOptions: BuildOptions = {
    outdir: outDir,
    entryPoints: srcFiles,
    sourcemap,
    target,
    minify,
    plugins,
    tsconfig: tsConfigFile,
    format,
    ...esBuildOpts
  };

  const assetPatterns = userConfig.assets?.filePatterns || ["**"];

  const assetsOptions = {
    baseDir: userConfig.assets?.baseDir || "src",
    outDir: userConfig.assets?.outDir || outDir,
    patterns: [...assetPatterns, `!**/*.{ts,js,tsx,jsx}`],
  };

  return { outDir, esbuildOptions, assetsOptions };
}

async function buildSourceFiles(esbuildOptions: Partial<BuildOptions>) {
  return await build({
    bundle: false,
    format: "cjs",
    platform: "node",
    ...esbuildOptions,
  });
}

type AssetsOptions = { baseDir: string; outDir: string; patterns: string[] };

async function copyNonSourceFiles({
  baseDir,
  outDir,
  patterns,
}: AssetsOptions) {
  const relativeOutDir = path.relative(baseDir, outDir);
  return await cpy(patterns, relativeOutDir, {
    cwd: baseDir,
  });
}

async function getConfig():Promise<Config> {
  const configFilename = <string>(await argv)?.config || `esbn.config.js`
  const esbnConf = await readUserConfig(path.resolve(cwd, configFilename))
  const config = esbnConf || await readUserConfig(path.resolve(cwd, `etsc.config.js`)) 

  return config || {}
}

async function main() {
  const config = await getConfig();
  const clean = <boolean>(await argv)?.clean || false;

  const { outDir, esbuildOptions, assetsOptions } = getBuildMetadata(config);

  if (clean) {
    rimraf.sync(outDir);
  }

  await Promise.all([
    buildSourceFiles(esbuildOptions),
    copyNonSourceFiles(assetsOptions),
  ]);
}

console.time("Built in");

main()
  .then(() => {
    console.timeEnd("Built in");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
