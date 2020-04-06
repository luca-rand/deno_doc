const plugin = require("tailwindcss/plugin");
const postcss = require("postcss");

module.exports = plugin(
  function ({ addVariant, e }) {
    addVariant("dark", ({ container, separator }) => {
      const prefersDarkRule = postcss.atRule({
        name: "media",
        params: "screen and (prefers-color-scheme: dark)",
      });
      prefersDarkRule.append(container.nodes);
      container.append(prefersDarkRule);
      prefersDarkRule.walkRules((rule) => {
        rule.selector = `.${e(`dark${separator}${rule.selector.slice(1)}`)}`;
      });
    });
  },
  {
    variants: {
      backgroundColor: ["responsive", "hover", "focus", "dark"],
      borderColor: ["responsive", "hover", "focus", "dark"],
      boxShadow: ["responsive", "hover", "focus", "dark"],
      opacity: ["responsive", "hover", "focus", "dark"],
      placeholderColor: ["responsive", "focus", "dark"],
      textColor: ["responsive", "hover", "focus", "dark"],
    },
  }
);
