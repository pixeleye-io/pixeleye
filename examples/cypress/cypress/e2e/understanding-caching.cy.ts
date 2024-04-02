describe("Understanding caching page - e2e", () => {
  it("Should take a screenshot of the understanding caching page", () => {
    cy.visit("/docs/understanding-caching");

    cy.get("kbd.ml-auto").should("be.visible");

    cy.setTheme("Light");
    cy.pixeleyeSnapshot({
      name: "Understanding caching page",
      variant: "light",
    });

    cy.setTheme("Dark");
    cy.pixeleyeSnapshot({
      name: "Understanding caching page",
      variant: "dark",
    });
  });
});
