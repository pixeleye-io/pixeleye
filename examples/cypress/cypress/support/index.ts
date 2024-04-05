declare namespace Cypress {
  interface Chainable {
    setTheme: (theme: "Dark" | "Light" | "System") => void;
  }
}
