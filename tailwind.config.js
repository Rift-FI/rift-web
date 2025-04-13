/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#3A7BD5", // Converting rgb(58, 123, 213) to hex
          light: "#3A7BD51A", // Converting rgba(58, 123, 213, 0.1) to hex with alpha
        },
        success: {
          DEFAULT: "#2ECC71", // Converting rgb(46, 204, 113) to hex
          light: "#2ECC711A", // Converting rgba(46, 204, 113, 0.1) to hex with alpha
        },
        danger: {
          DEFAULT: "#E74C3C", // Converting rgb(231, 76, 60) to hex
          light: "#E74C3C1A", // Converting rgba(231, 76, 60, 0.1) to hex with alpha
        },
        dark: {
          DEFAULT: "#1E2432", // Converting rgb(30, 36, 50) to hex
          light: "#1E243299", // Converting rgba(30, 36, 50, 0.6) to hex with alpha
        },
      },
      blur: {
        md: "10px",
      },
      borderRadius: {
        lg: "0.75rem",
      },
      boxShadow: {
        hover: "0 8px 32px rgba(0, 0, 0, 0.2)",
        card: "0 4px 16px rgba(16, 185, 129, 0.05)",
      },
      backgroundImage: {
        "gradient-primary":
          "linear-gradient(135deg, rgba(58, 123, 213, 0.1) 0%, rgba(58, 123, 213, 0.05) 100%)",
        "gradient-success":
          "linear-gradient(to right, rgba(16, 185, 129, 0.05) 0%, rgba(52, 211, 153, 0.1) 100%)",
      },
    },
  },
  plugins: [],
};
