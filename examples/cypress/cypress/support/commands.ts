import "@pixeleye/cypress";

Cypress.Commands.add("setTheme", (theme) => {
  const buttonSelector = "header button[aria-label='Theme']";
  cy.get(buttonSelector).click({
    scrollBehavior: false,
  });

  cy.get(buttonSelector).siblings("ul").find(`li:contains(${theme})`).click({
    scrollBehavior: false,
  });
});
