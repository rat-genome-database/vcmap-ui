module.exports = {
    "env": {
      "browser": true,
      "es6": true
    },
    "extends": [
      "eslint:recommended",
      "plugin:vue/essential",
      "plugin:@typescript-eslint/eslint-recommended"
    ],
    "globals": {
      "Atomics": "readonly",
      "SharedArrayBuffer": "readonly",
      "defineProps": "readonly",
      "defineEmits": "readonly"
    },
    "parserOptions": {
      "ecmaVersion": 2018,
      "parser": "@typescript-eslint/parser",
      "sourceType": "module"
    },
    "plugins": [
      "vue",
      "@typescript-eslint"
    ],
    "rules": {
      "vue/no-multiple-template-root": "off",
      "semi": ["warn", "always"],
      "vue/no-v-for-template-key": "off",
      "vue/script-setup-uses-vars": "error",
      "no-inner-declarations": "off",
      "no-unused-vars": "warn"
    }
};
