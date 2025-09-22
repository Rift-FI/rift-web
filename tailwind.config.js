// tailwind.config.js
export default {
  content: ['./src/**/*.{ts,tsx,js,jsx,mdx,html}'],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Custom color mappings for better dark mode support
        'surface': 'var(--color-surface)',
        'surface-subtle': 'var(--color-surface-subtle)',
        'surface-alt': 'var(--color-surface-alt)',
        'text-default': 'var(--color-text-default)',
        'text-subtle': 'var(--color-text-subtle)',
        'accent-primary': 'var(--color-accent-primary)',
        'accent-secondary': 'var(--color-accent-secondary)',
      }
    }
  }
};
