const config = {
  token: "pxi__sVEgnuVysmiqk2lxRZ6eH7M7gO-vaZPV:Ezx8dXSwxHRRghzTrLJat",
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
