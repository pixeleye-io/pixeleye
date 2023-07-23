import pact from "pactum";

it("should get a response with status code 200", async () => {
  await pact.spec().get("http://httpbin.org/status/200").expectStatus(200);
});
