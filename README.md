# esb-node
This is starting out as a fork of this [repo](https://github.com/a7ul/esbuild-node-tsc)
But because they don't think bundle in node.js should be allowed, I had to fork it.
I plan to make a few other changes, so I just made it it's own repo.
But, as of right now, the repo is the same except it gives you full access to the esbuild config.
For more information see the [Readme in the parent repo](https://github.com/a7ul/esbuild-node-tsc)

## Notes
* I changed the bin file name from `etsc` to `esbn` to not conflict with the parent repo
* If you were using that repo previously, be sure to update your scripts to use `esbn`

## Install
```sh
yarn add @ltipton/esb-node --dev
```

## Usage
* Add an `esbn` script to your package.json scripts section
  ```json
    "scripts": {
      "dev": "esbn --config=path/to/my/config.js"
    }
  ```
* Next, run the command `yarn dev` from the same directory as the `package.json`

## Configuration
* See esbuild options [here](https://esbuild.github.io/api/#build-api)
```ts

module.exports = {
  outDir: "./dist",
  esbuild: {
    bundle: true,
    // any other esbuild option
  },
  assets: {
    baseDir: "src",
    outDir: "./dist",
    filePatterns: ["**/*.json"],
  },
}
```