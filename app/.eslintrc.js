module.exports = {
    "env": {
      "browser": true,
      "node": "true",
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
      "vue/multi-word-component-names": "off",
      "vue/no-multiple-template-root": "off",
      "vue/no-v-model-argument": "off",
      "semi": ["warn", "always"],
      "vue/no-v-for-template-key": "off",
      "vue/script-setup-uses-vars": "error",
      "no-inner-declarations": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "warn", // ignores args in abstract functions
      "no-warning-comments": [
        "off", // change to "warn" to see all TODOs and FIXMEs in the codebase
        { "terms": ["todo", "fixme"], "location": "anywhere" }
      ]
    }
};
