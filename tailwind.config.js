/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{html,js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        "coolgray-10": "var(--coolgray-10)",
        "coolgray-20": "var(--coolgray-20)",
        "coolgray-30": "var(--coolgray-30)",
        "coolgray-60": "var(--coolgray-60)",
        "coolgray-90": "var(--coolgray-90)",
        "default-success": "var(--default-success)",
        defaultalert: "var(--defaultalert)",
        defaultwhite: "var(--defaultwhite)",
        "primary-60": "var(--primary-60)",
        "primary-90": "var(--primary-90)",
      },
      fontFamily: {
        "body-l": "var(--body-l-font-family)",
        "body-m": "var(--body-m-font-family)",
        "body-s": "var(--body-s-font-family)",
        "body-XS": "var(--body-XS-font-family)",
        "button-m": "var(--button-m-font-family)",
        "heading-2": "var(--heading-2-font-family)",
        "heading-4": "var(--heading-4-font-family)",
        "heading-6": "var(--heading-6-font-family)",
        "other-menu-m": "var(--other-menu-m-font-family)",
        "subtitle-s": "var(--subtitle-s-font-family)",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
};
