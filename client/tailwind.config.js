/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                cream: '#FBF4EC',
                charcoal: '#2B2118',
                spice: '#E0653A',
                turmeric: '#F2B340',
                steel: '#C7CCD1',
                leaf: '#5C7A52',
                cinnamon: '#9E6F46',
            },
            fontFamily: {
                display: ['Fraunces', 'serif'],
                body: ['DM Sans', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
