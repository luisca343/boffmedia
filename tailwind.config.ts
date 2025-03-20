import type { Config } from "tailwindcss"
import tplugin from "tailwindcss/plugin"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: "true",
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        vinque: ["Vinque", "sans-serif"],
      },
      textShadow: {
        border1:
          "rgb(0, 0, 0) 1px 0px 0px, rgb(0, 0, 0) 0.540302px 0.841471px 0px, rgb(0, 0, 0) -0.416147px 0.909297px 0px, rgb(0, 0, 0) -0.989992px 0.14112px 0px, rgb(0, 0, 0) -0.653644px -0.756802px 0px, rgb(0, 0, 0) 0.283662px -0.958924px 0px, rgb(0, 0, 0) 0.96017px -0.279415px 0px",
        border2:
          "rgb(0, 0, 0) 2px 0px 0px, rgb(0, 0, 0) 1.75517px 0.958851px 0px, rgb(0, 0, 0) 1.0806px 1.68294px 0px, rgb(0, 0, 0) 0.141474px 1.99499px 0px, rgb(0, 0, 0) -0.832294px 1.81859px 0px, rgb(0, 0, 0) -1.60229px 1.19694px 0px, rgb(0, 0, 0) -1.97998px 0.28224px 0px, rgb(0, 0, 0) -1.87291px -0.701566px 0px, rgb(0, 0, 0) -1.30729px -1.5136px 0px, rgb(0, 0, 0) -0.421592px -1.95506px 0px, rgb(0, 0, 0) 0.567324px -1.91785px 0px, rgb(0, 0, 0) 1.41734px -1.41108px 0px, rgb(0, 0, 0) 1.92034px -0.558831px 0px",
        border3:
          "rgb(0, 0, 0) 3px 0px 0px, rgb(0, 0, 0) 2.83487px 0.981584px 0px, rgb(0, 0, 0) 2.35766px 1.85511px 0px, rgb(0, 0, 0) 1.62091px 2.52441px 0px, rgb(0, 0, 0) 0.705713px 2.91581px 0px, rgb(0, 0, 0) -0.287171px 2.98622px 0px, rgb(0, 0, 0) -1.24844px 2.72789px 0px, rgb(0, 0, 0) -2.07227px 2.16926px 0px, rgb(0, 0, 0) -2.66798px 1.37182px 0px, rgb(0, 0, 0) -2.96998px 0.42336px 0px, rgb(0, 0, 0) -2.94502px -0.571704px 0px, rgb(0, 0, 0) -2.59586px -1.50383px 0px, rgb(0, 0, 0) -1.96093px -2.27041px 0px, rgb(0, 0, 0) -1.11013px -2.78704px 0px, rgb(0, 0, 0) -0.137119px -2.99686px 0px, rgb(0, 0, 0) 0.850987px -2.87677px 0px, rgb(0, 0, 0) 1.74541px -2.43999px 0px, rgb(0, 0, 0) 2.44769px -1.73459px 0px, rgb(0, 0, 0) 2.88051px -0.838247px 0px;",
      },
      boxShadow: {
        left: "-5px 0px 10px 2px rgba(33,33,33, .3);",
        right: "5px 0px 10px 2px rgba(33,33,33, .3);",
        light: "4px 4px 0px 0px #000",
        dark: "4px 4px 0px 2px #000",
      },
      translate: {
        boxShadowX: "4px",
        boxShadowY: "4px",
        reverseBoxShadowX: "-4px",
        reverseBoxShadowY: "-4px",
      },
      colors: {
        primary: {
          50: "rgb(var(--primary-50) / <alpha-value>)",
          100: "rgb(var(--primary-100) / <alpha-value>)",
          200: "rgb(var(--primary-200) / <alpha-value>)",
          300: "rgb(var(--primary-300) / <alpha-value>)",
          400: "rgb(var(--primary-400) / <alpha-value>)",
          500: "rgb(var(--primary-500) / <alpha-value>)",
          600: "rgb(var(--primary-600) / <alpha-value>)",
          700: "rgb(var(--primary-700) / <alpha-value>)",
          800: "rgb(var(--primary-800) / <alpha-value>)",
          900: "rgb(var(--primary-900) / <alpha-value>)",
          950: "rgb(var(--primary-950) / <alpha-value>)",
        },
        secondary: {
          50: "rgb(var(--secondary-50) / <alpha-value>)",
          100: "rgb(var(--secondary-100) / <alpha-value>)",
          200: "rgb(var(--secondary-200) / <alpha-value>)",
          300: "rgb(var(--secondary-300) / <alpha-value>)",
          400: "rgb(var(--secondary-400) / <alpha-value>)",
          500: "rgb(var(--secondary-500) / <alpha-value>)",
          600: "rgb(var(--secondary-600) / <alpha-value>)",
          700: "rgb(var(--secondary-700) / <alpha-value>)",
          800: "rgb(var(--secondary-800) / <alpha-value>)",
          900: "rgb(var(--secondary-900) / <alpha-value>)",
          950: "rgb(var(--secondary-950) / <alpha-value>)",
        },
        accent: {
          50: "rgb(var(--accent-50) / <alpha-value>)",
          100: "rgb(var(--accent-100) / <alpha-value>)",
          200: "rgb(var(--accent-200) / <alpha-value>)",
          300: "rgb(var(--accent-300) / <alpha-value>)",
          400: "rgb(var(--accent-400) / <alpha-value>)",
          500: "rgb(var(--accent-500) / <alpha-value>)",
          600: "rgb(var(--accent-600) / <alpha-value>)",
          700: "rgb(var(--accent-700) / <alpha-value>)",
          800: "rgb(var(--accent-800) / <alpha-value>)",
          900: "rgb(var(--accent-900) / <alpha-value>)",
          950: "rgb(var(--accent-950) / <alpha-value>)",
        },
        surface: {
          50: "rgb(var(--surface-50) / <alpha-value>)",
          100: "rgb(var(--surface-100) / <alpha-value>)",
          200: "rgb(var(--surface-200) / <alpha-value>)",
          300: "rgb(var(--surface-300) / <alpha-value>)",
          400: "rgb(var(--surface-400) / <alpha-value>)",
          500: "rgb(var(--surface-500) / <alpha-value>)",
          600: "rgb(var(--surface-600) / <alpha-value>)",
          700: "rgb(var(--surface-700) / <alpha-value>)",
          800: "rgb(var(--surface-800) / <alpha-value>)",
          900: "rgb(var(--surface-900) / <alpha-value>)",
          950: "rgb(var(--surface-950) / <alpha-value>)",
        },
        highlight: {
          50: "rgb(var(--highlight-50) / <alpha-value>)",
          100: "rgb(var(--highlight-100) / <alpha-value>)",
          200: "rgb(var(--highlight-200) / <alpha-value>)",
          300: "rgb(var(--highlight-300) / <alpha-value>)",
          400: "rgb(var(--highlight-400) / <alpha-value>)",
          500: "rgb(var(--highlight-500) / <alpha-value>)",
          600: "rgb(var(--highlight-600) / <alpha-value>)",
          700: "rgb(var(--highlight-700) / <alpha-value>)",
          800: "rgb(var(--highlight-800) / <alpha-value>)",
          900: "rgb(var(--highlight-900) / <alpha-value>)",
          950: "rgb(var(--highlight-950) / <alpha-value>)",
        },
        success: {
          50: "rgb(var(--success-50) / <alpha-value>)",
          100: "rgb(var(--success-100) / <alpha-value>)",
          200: "rgb(var(--success-200) / <alpha-value>)",
          300: "rgb(var(--success-300) / <alpha-value>)",
          400: "rgb(var(--success-400) / <alpha-value>)",
          500: "rgb(var(--success-500) / <alpha-value>)",
          600: "rgb(var(--success-600) / <alpha-value>)",
          700: "rgb(var(--success-700) / <alpha-value>)",
          800: "rgb(var(--success-800) / <alpha-value>)",
          900: "rgb(var(--success-900) / <alpha-value>)",
          950: "rgb(var(--success-950) / <alpha-value>)",
        },
        warning: {
          50: "rgb(var(--warning-50) / <alpha-value>)",
          100: "rgb(var(--warning-100) / <alpha-value>)",
          200: "rgb(var(--warning-200) / <alpha-value>)",
          300: "rgb(var(--warning-300) / <alpha-value>)",
          400: "rgb(var(--warning-400) / <alpha-value>)",
          500: "rgb(var(--warning-500) / <alpha-value>)",
          600: "rgb(var(--warning-600) / <alpha-value>)",
          700: "rgb(var(--warning-700) / <alpha-value>)",
          800: "rgb(var(--warning-800) / <alpha-value>)",
          900: "rgb(var(--warning-900) / <alpha-value>)",
          950: "rgb(var(--warning-950) / <alpha-value>)",
        },
        error: {
          50: "rgb(var(--error-50) / <alpha-value>)",
          100: "rgb(var(--error-100) / <alpha-value>)",
          200: "rgb(var(--error-200) / <alpha-value>)",
          300: "rgb(var(--error-300) / <alpha-value>)",
          400: "rgb(var(--error-400) / <alpha-value>)",
          500: "rgb(var(--error-500) / <alpha-value>)",
          600: "rgb(var(--error-600) / <alpha-value>)",
          700: "rgb(var(--error-700) / <alpha-value>)",
          800: "rgb(var(--error-800) / <alpha-value>)",
          900: "rgb(var(--error-900) / <alpha-value>)",
          950: "rgb(var(--error-950) / <alpha-value>)",
        },
        info: {
          50: "rgb(var(--info-50) / <alpha-value>)",
          100: "rgb(var(--info-100) / <alpha-value>)",
          200: "rgb(var(--info-200) / <alpha-value>)",
          300: "rgb(var(--info-300) / <alpha-value>)",
          400: "rgb(var(--info-400) / <alpha-value>)",
          500: "rgb(var(--info-500) / <alpha-value>)",
          600: "rgb(var(--info-600) / <alpha-value>)",
          700: "rgb(var(--info-700) / <alpha-value>)",
          800: "rgb(var(--info-800) / <alpha-value>)",
          900: "rgb(var(--info-900) / <alpha-value>)",
          950: "rgb(var(--info-950) / <alpha-value>)",
        },
        gray: {
          "50": "#f9fafb",
          "100": "#f3f4f6",
          "200": "#e5e7eb",
          "300": "#d1d5db",
          "400": "#9ca3af",
          "500": "#6b7280",
          "600": "#4b5563",
          "700": "#374151",
          "800": "#1f2937",
          "850": "#141b28",
          "900": "#111827",
          "950": "#030712",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
      fontSize: {
        "2xs": "0.625rem",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "float-wingull": {
          "0%, 100%": {
            transform: "translateY(0) rotate(-12deg)",
          },
          "50%": {
            transform: "translateY(-30px) rotate(5deg)",
          },
        },
        "bounce-spin": {
          "0%, 100%": {
            transform: "translateY(0) rotate(0deg)",
          },
          "50%": {
            transform: "translateY(-20px) rotate(180deg)",
          },
        },
      },
      animation: {
        "float-wingull": "float-wingull 8s ease-in-out infinite",
        "bounce-spin": "bounce-spin 6s ease-in-out infinite",
        appear: "appear 0.3s ease-out",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("tailwindcss-textshadow"),
    tplugin(({ theme, addUtilities }) => {
      const shadowUtilities: { [key: string]: { textShadow: string } } = {}
      const colors = theme("colors") as Record<string, string>

      for (const color in colors) {
        if (typeof colors[color] === "object") {
          const borderColor = colors[color][900].replace("<alpha-value>", ".8")

          shadowUtilities[`.text-shadow-${color}-border1`] = {
            textShadow: `${borderColor} 1px 0px 0px, ${borderColor} 0.540302px 0.841471px 0px, ${borderColor} -0.416147px 0.909297px 0px, ${borderColor} -0.989992px 0.14112px 0px, ${borderColor} -0.653644px -0.756802px 0px, ${borderColor} 0.283662px -0.958924px 0px, ${borderColor} 0.96017px -0.279415px 0px`,
          }
          shadowUtilities[`.text-shadow-${color}-border2`] = {
            textShadow: `${borderColor} 2px 0px 0px, ${borderColor} 1.75517px 0.958851px 0px, ${borderColor} 1.0806px 1.68294px 0px, ${borderColor} 0.141474px 1.99499px 0px, ${borderColor} -0.832294px 1.81859px 0px, ${borderColor} -1.60229px 1.19694px 0px, ${borderColor} -1.97998px 0.28224px 0px, ${borderColor} -1.87291px -0.701566px 0px, ${borderColor} -1.30729px -1.5136px 0px, ${borderColor} -0.421592px -1.95506px 0px, ${borderColor} 0.567324px -1.91785px 0px, ${borderColor} 1.41734px -1.41108px 0px, ${borderColor} 1.92034px -0.558831px 0px`,
          }
          shadowUtilities[`.text-shadow-${color}-border3`] = {
            textShadow: `${borderColor} 3px 0px 0px, ${borderColor} 2.83487px 0.981584px 0px, ${borderColor} 2.35766px 1.85511px 0px, ${borderColor} 1.62091px 2.52441px 0px, ${borderColor} 0.705713px 2.91581px 0px, ${borderColor} -0.287171px 2.98622px 0px, ${borderColor} -1.24844px 2.72789px 0px, ${borderColor} -2.07227px 2.16926px 0px, ${borderColor} -2.66798px 1.37182px 0px, ${borderColor} -2.96998px 0.42336px 0px, ${borderColor} -2.94502px -0.571704px 0px, ${borderColor} -2.59586px -1.50383px 0px, ${borderColor} -1.96093px -2.27041px 0px, ${borderColor} -1.11013px -2.78704px 0px, ${borderColor} -0.137119px -2.99686px 0px, ${borderColor} 0.850987px -2.87677px 0px, ${borderColor} 1.74541px -2.43999px 0px, ${borderColor} 2.44769px -1.73459px 0px, ${borderColor} 2.88051px -0.838247px 0px`,
          }
        }
      }

      addUtilities(shadowUtilities)
    }),
  ],
} satisfies Config

export default config

