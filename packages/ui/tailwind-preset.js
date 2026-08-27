/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        wine: "var(--tharagai-wine)",
        brass: "var(--tharagai-brass)",
        ink: "var(--tharagai-ink)",
        linen: "var(--tharagai-linen)",
        teal: "var(--tharagai-teal)",
        muted: "var(--tharagai-muted)",
        border: "var(--tharagai-border)",
        elevated: "var(--tharagai-surface-elevated)",
        danger: "var(--tharagai-danger)",
        success: "var(--tharagai-success)",
      },
      fontFamily: {
        display: ["var(--font-newsreader)", "Georgia", "serif"],
        sans: ["var(--font-figtree)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      spacing: {
        header: "var(--header-height)",
      },
      zIndex: {
        announcement: "var(--z-announcement)",
        header: "var(--z-header)",
        overlay: "var(--z-overlay)",
        modal: "var(--z-modal)",
      },
      boxShadow: {
        soft: "0 8px 24px rgba(20, 17, 15, 0.08)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 250ms ease-out",
        "slide-in-right": "slide-in-right 200ms ease-out",
      },
    },
  },
};
