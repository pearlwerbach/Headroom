import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter Tight", "Inter", "Avenir Next", "Trebuchet MS", "sans-serif"],
        serif: ["Iowan Old Style", "Palatino Linotype", "Book Antiqua", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
