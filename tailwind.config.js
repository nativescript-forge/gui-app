import daisyui from "daisyui";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["light"],
          primary: "#f9a825",
          "primary-content": "#ffffff",
          secondary: "#263238",
          "secondary-content": "#ffffff",
          accent: "#455a64",
          "accent-content": "#ffffff",
        },
        dark: {
          ...require("daisyui/src/theming/themes")["dark"],
          primary: "#f9a825",
          "primary-content": "#121212",
          secondary: "#37474f",
          "secondary-content": "#ffffff",
          accent: "#546e7a",
          "accent-content": "#ffffff",
        },
      },
    ],
  },
};
