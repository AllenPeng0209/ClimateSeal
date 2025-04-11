/** @type {import('@remix-run/dev').AppConfig} */
export default {
  ignoredRouteFiles: ["**/.*"],
  serverModuleFormat: "esm",
  serverPlatform: "vercel",
  tailwind: true,
  postcss: true,
  watchPaths: ["./tailwind.config.ts"],
  serverDependenciesToBundle: [/.*/],
  future: {
    v2_dev: true,
    v2_errorBoundary: true,
    v2_headers: true,
    v2_meta: true,
    v2_normalizeFormMethod: true,
    v2_routeConvention: true,
  },
  publicPath: "/build/",
  serverBuildPath: "api/index.js",
  assetsBuildDirectory: "public/build",
}; 