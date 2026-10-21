/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b1220",
        mist: "#f5f7fb",
        cyan: "#0e7490",
        violet: "#6d5bd0",
      },
      boxShadow: {
        card: "0 20px 50px -30px rgba(15, 23, 42, 0.35)",
      },
    },
  },
  plugins: [],
};