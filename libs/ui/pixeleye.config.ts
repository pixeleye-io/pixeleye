const config = {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  // token: process.env.PIXELEYE_TOKEN!,
  token: "pxi__MHL-aNSTpQW0Bd6U3TPXTvA6tovogB-_:zsZi9oUwDLwkjNL29gUMT",
  endpoint: "http://localhost:5000",
  storybookOptions: {
    variants: [
      {
        name: "Dark",
        params: "globals=theme:dark",
      },
      {
        name: "Light",
        params: "globals=theme:light",
      },
    ],
  },
};

export default config;
