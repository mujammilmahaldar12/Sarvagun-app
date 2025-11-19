module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo"],
      "nativewind/babel"
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./",
            "@features": "./src/features",
            "@shared": "./src/shared",
            "@lib": "./src/lib",
          },
        },
      ],
      "react-native-reanimated/plugin"
    ]
  };
};
