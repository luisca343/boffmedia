import { plugin } from "postcss"
import type { Config } from "tailwindcss"
import tplugin  from "tailwindcss/plugin"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        'vinque': ['Vinque', 'sans-serif']
      },
      textShadow: {
        border1: 'rgb(0, 0, 0) 1px 0px 0px, rgb(0, 0, 0) 0.540302px 0.841471px 0px, rgb(0, 0, 0) -0.416147px 0.909297px 0px, rgb(0, 0, 0) -0.989992px 0.14112px 0px, rgb(0, 0, 0) -0.653644px -0.756802px 0px, rgb(0, 0, 0) 0.283662px -0.958924px 0px, rgb(0, 0, 0) 0.96017px -0.279415px 0px',
        border2: 'rgb(0, 0, 0) 2px 0px 0px, rgb(0, 0, 0) 1.75517px 0.958851px 0px, rgb(0, 0, 0) 1.0806px 1.68294px 0px, rgb(0, 0, 0) 0.141474px 1.99499px 0px, rgb(0, 0, 0) -0.832294px 1.81859px 0px, rgb(0, 0, 0) -1.60229px 1.19694px 0px, rgb(0, 0, 0) -1.97998px 0.28224px 0px, rgb(0, 0, 0) -1.87291px -0.701566px 0px, rgb(0, 0, 0) -1.30729px -1.5136px 0px, rgb(0, 0, 0) -0.421592px -1.95506px 0px, rgb(0, 0, 0) 0.567324px -1.91785px 0px, rgb(0, 0, 0) 1.41734px -1.41108px 0px, rgb(0, 0, 0) 1.92034px -0.558831px 0px',
        border3: 'rgb(0, 0, 0) 3px 0px 0px, rgb(0, 0, 0) 2.83487px 0.981584px 0px, rgb(0, 0, 0) 2.35766px 1.85511px 0px, rgb(0, 0, 0) 1.62091px 2.52441px 0px, rgb(0, 0, 0) 0.705713px 2.91581px 0px, rgb(0, 0, 0) -0.287171px 2.98622px 0px, rgb(0, 0, 0) -1.24844px 2.72789px 0px, rgb(0, 0, 0) -2.07227px 2.16926px 0px, rgb(0, 0, 0) -2.66798px 1.37182px 0px, rgb(0, 0, 0) -2.96998px 0.42336px 0px, rgb(0, 0, 0) -2.94502px -0.571704px 0px, rgb(0, 0, 0) -2.59586px -1.50383px 0px, rgb(0, 0, 0) -1.96093px -2.27041px 0px, rgb(0, 0, 0) -1.11013px -2.78704px 0px, rgb(0, 0, 0) -0.137119px -2.99686px 0px, rgb(0, 0, 0) 0.850987px -2.87677px 0px, rgb(0, 0, 0) 1.74541px -2.43999px 0px, rgb(0, 0, 0) 2.44769px -1.73459px 0px, rgb(0, 0, 0) 2.88051px -0.838247px 0px;',
      },
      boxShadow: {
        'left': '-5px 0px 10px 2px rgba(33,33,33, .3);',
        'right': '5px 0px 10px 2px rgba(33,33,33, .3);',
        'light': '4px 4px 0px 0px #000',
        'dark': '4px 4px 0px 2px #000', 
      },
      translate: {
        boxShadowX: '4px',
        boxShadowY: '4px',
        reverseBoxShadowX: '-4px',
        reverseBoxShadowY: '-4px',
      },
      colors: {
        'primary': {
          '50': 'var(--primary-50)',
          '100': 'var(--primary-100)',
          '200': 'var(--primary-200)',
          '300': 'var(--primary-300)',
          '400': 'var(--primary-400)',
          '500': 'var(--primary-500)',
          '600': 'var(--primary-600)',
          '700': 'var(--primary-700)',
          '800': 'var(--primary-800)',
          '900': 'var(--primary-900)',
          '950': 'var(--primary-950)',
      },
      'main': {
        '50': 'var(--main-50)',
        '100': 'var(--main-100)',
        '200': 'var(--main-200)',
        '300': 'var(--main-300)',
        '400': 'var(--main-400)',
        '500': 'var(--main-500)',
        '600': 'var(--main-600)',
        '700': 'var(--main-700)',
        '800': 'var(--main-800)',
        '900': 'var(--main-900)',
        '950': 'var(--main-950)',
      },
      'gray': {
        '50': '#f9fafb',
        '100': '#f3f4f6',
        '200': '#e5e7eb',
        '300': '#d1d5db',
        '400': '#9ca3af',
        '500': '#6b7280',
        '600': '#4b5563',
        '700': '#374151',
        '800': '#1f2937',
        '850': '#141b28',
        '900': '#111827',
        '950': '#030712',
      },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontSize: {
        '2xs': '0.625rem', // Add this line
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require('tailwindcss-textshadow'),
  tplugin(({ theme, addUtilities }) => {
    const shadowUtilities: { [key: string]: { textShadow: string } } = {};
    const colors = theme('colors') as Record<string, string>;
  
    for (const color in colors) {
      if (typeof colors[color] === 'object') {
        const borderColor = colors[color][900]
        
        shadowUtilities[`.text-shadow-${color}-border1`] = {
          textShadow: `${borderColor} 1px 0px 0px, ${borderColor} 0.540302px 0.841471px 0px, ${borderColor} -0.416147px 0.909297px 0px, ${borderColor} -0.989992px 0.14112px 0px, ${borderColor} -0.653644px -0.756802px 0px, ${borderColor} 0.283662px -0.958924px 0px, ${borderColor} 0.96017px -0.279415px 0px`,
        };
        shadowUtilities[`.text-shadow-${color}-border2`] = {
          textShadow: `${borderColor} 2px 0px 0px, ${borderColor} 1.75517px 0.958851px 0px, ${borderColor} 1.0806px 1.68294px 0px, ${borderColor} 0.141474px 1.99499px 0px, ${borderColor} -0.832294px 1.81859px 0px, ${borderColor} -1.60229px 1.19694px 0px, ${borderColor} -1.97998px 0.28224px 0px, ${borderColor} -1.87291px -0.701566px 0px, ${borderColor} -1.30729px -1.5136px 0px, ${borderColor} -0.421592px -1.95506px 0px, ${borderColor} 0.567324px -1.91785px 0px, ${borderColor} 1.41734px -1.41108px 0px, ${borderColor} 1.92034px -0.558831px 0px`,
        };
        shadowUtilities[`.text-shadow-${color}-border3`] = {
          textShadow: `${borderColor} 3px 0px 0px, ${borderColor} 2.83487px 0.981584px 0px, ${borderColor} 2.35766px 1.85511px 0px, ${borderColor} 1.62091px 2.52441px 0px, ${borderColor} 0.705713px 2.91581px 0px, ${borderColor} -0.287171px 2.98622px 0px, ${borderColor} -1.24844px 2.72789px 0px, ${borderColor} -2.07227px 2.16926px 0px, ${borderColor} -2.66798px 1.37182px 0px, ${borderColor} -2.96998px 0.42336px 0px, ${borderColor} -2.94502px -0.571704px 0px, ${borderColor} -2.59586px -1.50383px 0px, ${borderColor} -1.96093px -2.27041px 0px, ${borderColor} -1.11013px -2.78704px 0px, ${borderColor} -0.137119px -2.99686px 0px, ${borderColor} 0.850987px -2.87677px 0px, ${borderColor} 1.74541px -2.43999px 0px, ${borderColor} 2.44769px -1.73459px 0px, ${borderColor} 2.88051px -0.838247px 0px`,
        };
        shadowUtilities[`.text-shadow-${color}-border4`] = {
          textShadow: `${borderColor} 4px 0px 0px, ${borderColor} 3.87565px 0.989616px 0px, ${borderColor} 3.51033px 1.9177px 0px, ${borderColor} 2.92676px 2.72656px 0px, ${borderColor} 2.16121px 3.36588px 0px, ${borderColor} 1.26129px 3.79594px 0px, ${borderColor} 0.282949px 3.98998px 0px, ${borderColor} -0.712984px 3.93594px 0px, ${borderColor} -1.66459px 3.63719px 0px, ${borderColor} -2.51269px 3.11229px 0px, ${borderColor} -3.20457px 2.39389px 0px, ${borderColor} -3.69721px 1.52664px 0px, ${borderColor} -3.95997px 0.56448px 0px, ${borderColor} -3.97652px -0.432781px 0px, ${borderColor} -3.74583px -1.40313px 0px, ${borderColor} -3.28224px -2.28625px 0px, ${borderColor} -2.61457px -3.02721px 0px, ${borderColor} -1.78435px -3.57996px 0px, ${borderColor} -0.843183px -3.91012px 0px, ${borderColor} 0.150409px -3.99717px 0px, ${borderColor} 1.13465px -3.8357px 0px, ${borderColor} 2.04834px -3.43574px 0px, ${borderColor} 2.83468px -2.82216px 0px, ${borderColor} 3.44477px -2.03312px 0px, ${borderColor} 3.84068px -1.11766px 0px, ${
            borderColor
          } 3.9978px -0.132717px 0px`,
        };
          
      }
    }
  
    addUtilities(shadowUtilities);
  })
],
} satisfies Config

export default config