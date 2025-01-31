/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    ...((import.meta.env?.MODE || "development") === "production"
      ? { cssnano: {} }
      : {}),
  },
};

export default config;
