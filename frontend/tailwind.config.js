/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fdf8ef',
          100: '#faeed7',
          200: '#f3d9a8',
          300: '#eabd71',
          400: '#e2a23f',
          500: '#caa247',
          600: '#a87f2c',
          700: '#856325',
          800: '#6b4f23',
          900: '#5a4220',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
      },
    },
  },
  plugins: [],
};
