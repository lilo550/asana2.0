// E2E-Test fuer den Login-Flow. Braucht eine laufende Umgebung:
// - Backend auf http://localhost:3000 (Postgres verbunden)
// - Frontend-Dev-Server auf http://localhost:5173 (baseUrl, siehe cypress.config.js)
// - Den Seed-Account aus backend/prisma/seed.js (`npx prisma db seed`)
//
// Selektoren laufen ausschliesslich ueber data-cy-Attribute, nicht ueber
// Text- oder Typ-Selektoren - so bleibt der Test stabil, auch wenn sich
// Beschriftungen oder Styling-Klassen aendern.
const TEST_USER = {
  email: "test@example.com",
  password: "test1234",
};

describe("Login", () => {
  beforeEach(() => {
    // Sauberer Start ohne bestehende Session, damit die Middleware
    // zuverlaessig auf /login schickt bzw. dort bleibt.
    cy.clearCookies();
  });

  it("meldet einen Nutzer mit gueltigen Zugangsdaten an und leitet zur Startseite weiter", () => {
    cy.visit("/login");

    cy.get('[data-cy="login-email-input"]').type(TEST_USER.email);
    cy.get('[data-cy="login-password-input"]').type(TEST_USER.password);
    cy.get('[data-cy="login-submit-button"]').click();

    cy.url().should("eq", `${Cypress.config("baseUrl")}/`);
    cy.get('[data-cy="events-heading"]').should("be.visible").and("contain.text", "Meine Events");
    // Der JWT-Cookie ist HttpOnly (fuer Seiten-JS unsichtbar), aber Cypress
    // kann ihn zu Testzwecken trotzdem auslesen.
    cy.getCookie("token").should("exist");
  });

  it("zeigt bei falschem Passwort eine Fehlermeldung und bleibt auf /login", () => {
    cy.visit("/login");

    cy.get('[data-cy="login-email-input"]').type(TEST_USER.email);
    cy.get('[data-cy="login-password-input"]').type("falschesPasswort123");
    cy.get('[data-cy="login-submit-button"]').click();

    cy.get('[data-cy="error-message"]')
      .should("be.visible")
      .and("contain.text", "E-Mail oder Passwort ungültig.");
    cy.url().should("include", "/login");
    cy.getCookie("token").should("not.exist");
  });
});