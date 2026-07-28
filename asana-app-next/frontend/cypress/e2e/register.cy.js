// E2E-Test fuer die Registrierung. Braucht eine laufende Umgebung:
// - Backend auf http://localhost:3000 (Postgres verbunden)
// - Frontend-Dev-Server auf http://localhost:5173 (baseUrl, siehe cypress.config.js)
//
// Nutzt eine zeitstempel-basierte E-Mail, damit der Test beliebig oft gegen
// dieselbe (persistente) Datenbank laufen kann, ohne mit einem frueheren
// Testlauf zu kollidieren (409 "E-Mail bereits vergeben").
describe("Register", () => {
  beforeEach(() => {
    cy.clearCookies();
  });

  it("registriert einen neuen Nutzer und leitet zur Login-Seite weiter", () => {
    const uniqueEmail = `test-${Date.now()}@example.com`;

    cy.visit("/register");

    cy.get('[data-cy="register-email-input"]').type(uniqueEmail);
    cy.get('[data-cy="register-password-input"]').type("test1234");
    cy.get('[data-cy="register-submit-button"]').click();

    cy.url().should("eq", `${Cypress.config("baseUrl")}/login`);
  });
});