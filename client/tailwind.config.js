// Colours resolve to CSS variables defined in src/styles/tokens.css, so the
// light and dark themes share one set of class names.
const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;
const stone = {
  50: v("stone-50"),
  100: v("stone-100"),
  200: v("stone-200"),
  300: v("stone-300"),
  400: v("stone-400"),
  500: v("stone-500"),
  600: v("stone-600"),
  700: v("stone-700"),
  800: v("stone-800"),
  900: v("stone-900"),
  950: v("stone-950"),
};
const emerald = {
  50: v("emerald-50"),
  100: v("emerald-100"),
  200: v("emerald-200"),
  300: v("emerald-300"),
  400: v("emerald-400"),
  500: v("emerald-500"),
  600: v("emerald-600"),
  700: v("emerald-700"),
  800: v("emerald-800"),
  900: v("emerald-900"),
  950: v("emerald-950"),
};
const amber = {
  50: v("amber-50"),
  100: v("amber-100"),
  200: v("amber-200"),
  300: v("amber-300"),
  400: v("amber-400"),
  500: v("amber-500"),
  600: v("amber-600"),
  700: v("amber-700"),
  800: v("amber-800"),
  900: v("amber-900"),
  950: v("amber-950"),
};
const rose = {
  50: v("rose-50"),
  100: v("rose-100"),
  200: v("rose-200"),
  300: v("rose-300"),
  400: v("rose-400"),
  500: v("rose-500"),
  600: v("rose-600"),
  700: v("rose-700"),
  800: v("rose-800"),
  900: v("rose-900"),
  950: v("rose-950"),
};
const blue = {
  50: v("blue-50"),
  100: v("blue-100"),
  200: v("blue-200"),
  300: v("blue-300"),
  400: v("blue-400"),
  500: v("blue-500"),
  600: v("blue-600"),
  700: v("blue-700"),
  800: v("blue-800"),
  900: v("blue-900"),
  950: v("blue-950"),
};
const purple = {
  50: v("purple-50"),
  100: v("purple-100"),
  200: v("purple-200"),
  300: v("purple-300"),
  400: v("purple-400"),
  500: v("purple-500"),
  600: v("purple-600"),
  700: v("purple-700"),
  800: v("purple-800"),
  900: v("purple-900"),
  950: v("purple-950"),
};

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        white: v("white"),
        page: v("page"),
        stone,
        slate: stone,
        emerald,
        green: emerald,
        amber,
        rose,
        red: rose,
        blue,
        purple,
        primary: {
          DEFAULT: v("primary"),
          hover: v("primary-hover"),
          light: v("primary-light"),
        },
        accent: { DEFAULT: v("accent"), ink: v("accent-ink") },
      },
      fontFamily: {
        sans: [
          '"Manrope Variable"',
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        display: ['"Fraunces Variable"', "ui-serif", "Georgia", "serif"],
        mono: [
          '"JetBrains Mono Variable"',
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      boxShadow: {
        xs: "0 1px 2px rgb(16 15 13 / 0.05)",
        glass: "var(--glass-shadow)",
        lift: "var(--lift-shadow)",
      },
      backdropBlur: { xs: "3px" },
      borderWidth: { 3: "3px" },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [
    // Tailwind 4 name used across the app; equivalent to outline-none here.
    ({ addUtilities }) =>
      addUtilities({
        ".outline-hidden": {
          outline: "2px solid transparent",
          "outline-offset": "2px",
        },
      }),
  ],
};
