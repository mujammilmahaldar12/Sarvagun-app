module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'class',

  theme: {
    extend: {
      colors: {
        // Default Theme - Light
        'default-light': {
          background: "#ffffff",
          foreground: "#000000",
          primary: "#7f16ff",
        },
        // Default Theme - Dark
        'default-dark': {
          background: "#1a1a1a",
          foreground: "#ffffff",
          primary: "#9f3fff",
        },

        // Winter Theme - Light
        'winter-light': {
          background: "#E0F7FA",
          foreground: "#004D40",
          primary: "#00ACC1",
        },
        // Winter Theme - Dark
        'winter-dark': {
          background: "#004D40",
          foreground: "#E0F7FA",
          primary: "#26C6DA",
        },

        // Ganpati Theme - Light
        'ganpati-light': {
          background: "#FFF3E0",
          foreground: "#BF360C",
          primary: "#E65100",
        },
        // Ganpati Theme - Dark
        'ganpati-dark': {
          background: "#BF360C",
          foreground: "#FFF3E0",
          primary: "#FF6F00",
        },
      },
    },
  },
};
