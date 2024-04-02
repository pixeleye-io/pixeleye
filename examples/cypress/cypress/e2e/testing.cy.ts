describe("Testing page - e2e", () => {
  it("Should take a screenshot of the testing page", () => {
    cy.visit("/docs/testing");

    cy.get("kbd.ml-auto").should("be.visible");

    cy.setTheme("Light");
    cy.pixeleyeSnapshot({ name: "Testing page", variant: "light" });

    cy.setTheme("Dark");
    cy.pixeleyeSnapshot({ name: "Testing page", variant: "dark" });
  });
});
