/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        /* Azules principales (gestor de contraseñas, imagen landing) */
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        /* Logo: dorado/ámbar (escudo + G) */
        brand: {
          DEFAULT: "#d4af37",
          light: "#e5c65c",
          dark: "#b8962e",
        },
        /* Fondos claros (landing) */
        surface: {
          DEFAULT: "#f0f8ff", /* Alice Blue, fondo página */
          card: "#ffffff",   /* Tarjetas */
        },
        /* Texto (tema claro) */
        content: {
          heading: "#1f2937",   /* gray-900 */
          DEFAULT: "#4b5563",   /* gray-700 */
          muted: "#9ca3af",     /* gray-400 */
        },
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "SF Mono",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      backgroundImage: {
        "page-gradient": "linear-gradient(180deg, #f0f8ff 0%, #e8f4fc 50%, #f0f8ff 100%)",
        "button-gradient": "linear-gradient(90deg, #60a5fa 0%, #3b82f6 100%)",
      },
      boxShadow: {
        card: "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
        "card-lg": "0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)",
      },
      borderRadius: {
        card: "0.75rem",
        button: "0.5rem",
      },
    },
  },
  plugins: [],
};
