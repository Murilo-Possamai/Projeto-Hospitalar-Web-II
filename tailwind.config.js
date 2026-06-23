import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                sidebar: {
                    DEFAULT: '#0f3d38',
                    hover:   '#1a5c55',
                    active:  '#1a5c55',
                },
                brand: {
                    DEFAULT: '#2a9d8f',
                    dark:    '#0f3d38',
                    light:   '#52b788',
                },
            },
        },
    },

    plugins: [forms],
};
