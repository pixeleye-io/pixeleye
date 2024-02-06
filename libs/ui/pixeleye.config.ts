const config = {
  token: "pxi__4f7g0Fot3zgdDhxyXBKTQALE6cf5UaBP:OSdmZx8e-ALiCT_DG6F7T",
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
