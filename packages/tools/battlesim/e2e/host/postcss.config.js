// Vite picks this up from the config's `root`. Same two plugins the launcher
// uses; the tailwind config beside it is what scopes the content globs.
module.exports = {
  plugins: {
    tailwindcss: { config: require("path").join(__dirname, "tailwind.config.ts") },
    autoprefixer: {},
  },
};
