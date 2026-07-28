// E2E-Test fuer den Logout-Flow. Baut auf dem Seed-Account aus
// backend/prisma/seed.js auf (`npx prisma db seed`).
const TEST_USER = {
  email: "test@example.com",
  password: "test1234",
};

describe("Logout", () => {
  beforeEach(() => {
    cy.clearCookies();
  });

  it("meldet einen eingeloggten Nutzer ab und sperrt den erneuten Zugriff auf die Startseite", () => {
    cy.visit("/login");
    cy.get('[data-cy="login-email-input"]').type(TEST_USER.email);
    cy.get('[data-cy="login-password-input"]').type(TEST_USER.password);
    cy.get('[data-cy="login-submit-button"]').click();
    cy.get('[data-cy="events-heading"]').should("be.visible");

    cy.get('[data-cy="logout-button"]').click();

    cy.url().should("eq", `${Cypress.config("baseUrl")}/login`);
    cy.getCookie("token").should("not.exist");

    // Session ist wirklich beendet: erneuter Aufruf der Startseite landet
    // wieder auf /login statt Events zu zeigen.
    cy.visit("/");
    cy.url().should("eq", `${Cypress.config("baseUrl")}/login`);
  });
});