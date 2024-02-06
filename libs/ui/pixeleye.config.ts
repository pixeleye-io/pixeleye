const config = {
  token: "pxi__mTABxKK2sYY55ILmIvMTa-S6ABixvSPR:ZwEWrRCK_IyeX9sUzsh_v",
  endpoint: "http://localhost:5000",
  waitForStatus: true,

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
