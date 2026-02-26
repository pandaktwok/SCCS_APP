import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "media",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sccs: {
          green: "#0aa699", // Teal matches eTherapi buttons
          red: "#f39c12", // Orange matches eTherapi alerts
          dark: "#344050", // Sidebar Dark Blue-Grey matches eTherapi sidebar
          gray: "#f4f5f7", // Main background light gray
          border: "#e5e7eb" // Light borders
        }
      },
    },
  },
  plugins: [],
};
export default config;
