/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
  "./app/**/*.{js,ts,jsx,tsx,mdx}",
  "./components/**/*.{js,ts,jsx,tsx,mdx}",
],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0f4ff",
          100: "#e0e9ff",
          200: "#c7d7fe",
          300: "#a5b8fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        neon: {
          cyan:    "#00f5ff",
          green:   "#00ff88",
          purple:  "#b300ff",
          orange:  "#ff6b35",
        },
        dark: {
          50:  "#f8fafc",
          100: "#f1f5f9",
          700: "#1e293b",
          800: "#0f172a",
          900: "#020617",
          950: "#010309",
        }
      },
      fontFamily: {
        display: ["'Space Grotesk'","'DM Sans'","system-ui","sans-serif"],
        body:    ["'DM Sans'","system-ui","sans-serif"],
        mono:    ["'JetBrains Mono'","monospace"],
      },
      backgroundImage: {
        "gradient-radial":  "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":   "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "hero-mesh":        "radial-gradient(at 40% 20%,hsla(228,100%,74%,0.15) 0px,transparent 50%),radial-gradient(at 80% 0%,hsla(189,100%,56%,0.1) 0px,transparent 50%),radial-gradient(at 0% 50%,hsla(355,100%,93%,0.05) 0px,transparent 50%)",
      },
      animation: {
        "float":        "float 6s ease-in-out infinite",
        "pulse-slow":   "pulse 4s cubic-bezier(0.4,0,0.6,1) infinite",
        "glow":         "glow 2s ease-in-out infinite alternate",
        "slide-up":     "slideUp 0.5s ease-out",
        "fade-in":      "fadeIn 0.4s ease-out",
        "shimmer":      "shimmer 2.5s linear infinite",
        "spin-slow":    "spin 8s linear infinite",
      },
      keyframes: {
        float:    {"0%,100%":{transform:"translateY(0px)"},"50%":{transform:"translateY(-12px)"}},
        glow:     {"from":{boxShadow:"0 0 10px #6366f1,0 0 20px #6366f1"},"to":{boxShadow:"0 0 20px #6366f1,0 0 40px #6366f1,0 0 60px #6366f1"}},
        slideUp:  {"from":{transform:"translateY(16px)",opacity:"0"},"to":{transform:"translateY(0)",opacity:"1"}},
        fadeIn:   {"from":{opacity:"0"},"to":{opacity:"1"}},
        shimmer:  {"0%":{backgroundPosition:"-200% 0"},"100%":{backgroundPosition:"200% 0"}},
      },
      boxShadow: {
        "glow-sm":  "0 0 10px rgba(99,102,241,0.3)",
        "glow-md":  "0 0 20px rgba(99,102,241,0.4)",
        "glow-lg":  "0 0 40px rgba(99,102,241,0.5)",
        "card":     "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
        "card-hover":"0 16px 48px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.1)",
        "glass":    "0 8px 32px rgba(31,38,135,0.15), inset 0 0 0 1px rgba(255,255,255,0.1)",
      },
      backdropBlur: {
        xs: "2px",
      }
    },
  },
  plugins: [],
};
