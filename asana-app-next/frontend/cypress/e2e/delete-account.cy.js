// E2E-Test fuer die Konto-Loeschung. Registriert bewusst einen frischen,
// zeitstempel-basierten Nutzer statt den gemeinsamen Seed-Account zu nutzen -
// der wird von den anderen Specs gebraucht und darf hier nicht geloescht werden.
describe("Konto löschen", () => {
  beforeEach(() => {
    cy.clearCookies();
  });

  it("löscht das eigene Konto erst nach Bestätigung und verhindert danach den erneuten Login", () => {
    const email = `delete-${Date.now()}@example.com`;
    const password = "test1234";

    cy.visit("/register");
    cy.get('[data-cy="register-email-input"]').type(email);
    cy.get('[data-cy="register-password-input"]').type(password);
    cy.get('[data-cy="register-submit-button"]').click();
    cy.url().should("eq", `${Cypress.config("baseUrl")}/login`);

    cy.get('[data-cy="login-email-input"]').type(email);
    cy.get('[data-cy="login-password-input"]').type(password);
    cy.get('[data-cy="login-submit-button"]').click();
    cy.get('[data-cy="events-heading"]').should("be.visible");

    cy.get('[data-cy="account-menu-button"]').click();
    cy.get('[data-cy="delete-account-button"]').click();

    // Abbrechen darf das Konto nicht loeschen.
    cy.get('[data-cy="confirm-dialog-cancel"]').click();
    cy.url().should("eq", `${Cypress.config("baseUrl")}/dashboard`);

    cy.get('[data-cy="account-menu-button"]').click();
    cy.get('[data-cy="delete-account-button"]').click();
    cy.get('[data-cy="confirm-dialog-confirm"]').click();

    cy.url().should("eq", `${Cypress.config("baseUrl")}/`);
    cy.getCookie("token").should("not.exist");

    // Konto ist wirklich weg: Login mit denselben Zugangsdaten schlaegt fehl.
    cy.visit("/login");
    cy.get('[data-cy="login-email-input"]').type(email);
    cy.get('[data-cy="login-password-input"]').type(password);
    cy.get('[data-cy="login-submit-button"]').click();
    cy.get('[data-cy="error-message"]').should("be.visible");
  });
});