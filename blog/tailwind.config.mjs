/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				konfetti: {
					50: '#faf5ff',
					100: '#f3e8ff',
					200: '#e9d5ff',
					300: '#d8b4fe',
					400: '#c084fc',
					500: '#a855f7',
					600: '#a715e3',
					700: '#7e22ce',
					800: '#6b21a8',
					900: '#581c87',
				},
				foreground: 'hsl(345, 25%, 20%)',
				muted: {
					DEFAULT: 'hsl(20, 40%, 96%)',
					foreground: 'hsl(345, 15%, 55%)',
				},
				border: 'hsl(20, 30%, 92%)',
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				serif: ['Playfair Display', 'Georgia', 'serif'],
			},
			borderRadius: {
				'2xl': '1rem',
				'3xl': '1.5rem',
				'4xl': '1.75rem',
				'bloom': '28px',
			},
			boxShadow: {
				'xs': '0 2px 8px rgba(180, 22, 226, 0.08)',
				'soft': '0 4px 16px rgba(180, 22, 226, 0.12)',
				'card': '0 8px 24px -4px rgba(180, 22, 226, 0.15)',
				'card-hover': '0 12px 32px -8px rgba(180, 22, 226, 0.2)',
				'heavy': '0 20px 60px -10px rgba(180, 22, 226, 0.25)',
			},
			animation: {
				'fade-in': 'fadeIn 0.5s ease-in',
				'slide-up': 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
			},
			keyframes: {
				fadeIn: {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' },
				},
				slideUp: {
					'0%': { opacity: '0', transform: 'translateY(20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' },
				},
			},
		},
	},
	plugins: [],
};
