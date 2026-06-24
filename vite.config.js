import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// IMPORTANT: base must match your GitHub repo name exactly (with slashes)
// e.g. if repo is "hector365" and URL is username.github.io/hector365/
// then base should be "/hector365/"
export default defineConfig({
  plugins: [react()],
  base: "/hector365/",
});
