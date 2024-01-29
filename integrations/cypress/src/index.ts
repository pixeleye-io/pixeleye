import { pixeleyeSnapshot } from "./snapshot";
import { Options } from "./snapshot";
export type { Options } from "./snapshot";

declare global {
  namespace Cypress {
    interface Chainable {
      pixeleyeSnapshot(options: Options): Chainable<void>;
    }
  }
}

Cypress.Commands.add("pixeleyeSnapshot" as any, pixeleyeSnapshot as any);
