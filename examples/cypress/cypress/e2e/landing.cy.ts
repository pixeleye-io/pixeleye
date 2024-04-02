describe("Landing page - e2e", () => {
  it("Should take a screenshot of the landing page", () => {
    cy.visit("/");

    cy.get("kbd.ml-auto").should("be.visible");

    cy.setTheme("Light");
    cy.pixeleyeSnapshot({ name: "Landing page", variant: "light" });

    cy.setTheme("Dark");
    cy.pixeleyeSnapshot({ name: "Landing page", variant: "dark" });
  });

  it("Should take a screenshot of the search docs modal", () => {
    cy.visit("/");

    cy.get("kbd.ml-auto").should("be.visible");

    cy.setTheme("Light");
    cy.get("header button:contains('Search docs')").click({
      scrollBehavior: false,
    });
    cy.pixeleyeSnapshot({ name: "Docs modal", variant: "light" });

    cy.get("body").type("{esc}");

    cy.setTheme("Dark");
    cy.get("header button:contains('Search docs')").click({
      scrollBehavior: false,
    });
    cy.pixeleyeSnapshot({ name: "Docs modal", variant: "dark" });
  });
});
