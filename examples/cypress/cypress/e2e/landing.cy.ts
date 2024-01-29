describe("Landing page - e2e", () => {

  it("Should take a screenshot of the landing page", () => {
    cy.visit("/");
    cy.get("kbd.ml-auto").should("be.visible");
    cy.pixeleyeSnapshot({ name: "landing" });
  });
});
