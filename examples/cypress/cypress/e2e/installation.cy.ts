describe("Installation page - e2e", () => {
  it("Should take a screenshot of the installation page", () => {
    cy.visit("/docs/installation");

    cy.get("kbd.ml-auto").should("be.visible");

    cy.setTheme("Light");
    cy.pixeleyeSnapshot({ name: "Installation page", variant: "light" });

    cy.setTheme("Dark");
    cy.pixeleyeSnapshot({ name: "Installation page", variant: "dark" });
  });

  it("Should take a screenshot of the page footer", () => {
    cy.visit("/docs/installation");

    cy.get("kbd.ml-auto").should("be.visible");

    cy.scrollTo("bottom");

    cy.setTheme("Light");
    cy.pixeleyeSnapshot({
      name: "Footer",
      variant: "light",
      selector: "body div div dl",
    });

    cy.setTheme("Dark");
    cy.pixeleyeSnapshot({
      name: "Footer",
      variant: "dark",
      selector: "body div div dl",
    });
  });
});
