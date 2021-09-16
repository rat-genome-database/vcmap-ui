/**
 * vetur.config.js
 *
 * This config tells Vetur (VSCode extension) where to find our package.json and tsconfig.json files 
 * since they aren't in the root directory. This config only impacts how the VSCode IDE interprets and
 * highlights things. It has no effect on the project itself.
 */

/** @type {import('vls').VeturConfig} */
module.exports = {
  // **optional** default: `[{ root: './' }]`
  // support monorepos
  projects: [
    './', // Shorthand for specifying only the project root location
    {
      // **required**
      // Where is your project?
      // It is relative to `vetur.config.js`.
      root: './app'
    }
  ]
}