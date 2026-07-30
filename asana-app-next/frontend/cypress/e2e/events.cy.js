// E2E-Test fuer Event-CRUD (anlegen, bearbeiten, loeschen mit Bestaetigung).
// Registriert bewusst einen frischen, zeitstempel-basierten Nutzer statt den
// gemeinsamen Seed-Account zu nutzen, damit die Events-Liste in jedem Test
// garantiert leer startet und Assertions nicht von anderen Specs abhaengen.
function registerAndLogin() {
  const email = `events-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;
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
}

describe("Event verwalten", () => {
  beforeEach(() => {
    cy.clearCookies();
    registerAndLogin();
  });

  it("legt ein neues Event mit Name und Beschreibung an", () => {
    cy.get('[data-cy="new-event-open-button"]').click();
    cy.get('[data-cy="new-event-name-input"]').type("Firmenfeier");
    cy.get('[data-cy="new-event-description-input"]').type("Jährliches Sommerfest");
    cy.get('[data-cy="new-event-submit-button"]').click();

    cy.contains('[data-cy="event-card"]', "Firmenfeier").should("be.visible");
  });

  it("bearbeitet Name und Beschreibung eines bestehenden Events", () => {
    cy.get('[data-cy="new-event-open-button"]').click();
    cy.get('[data-cy="new-event-name-input"]').type("Altes Event");
    cy.get('[data-cy="new-event-submit-button"]').click();
    cy.contains('[data-cy="event-card"]', "Altes Event").should("be.visible");

    cy.contains('[data-cy="event-card"]', "Altes Event").within(() => {
      cy.get('[data-cy="edit-event-button"]').click();
      cy.get('[data-cy="edit-event-name-input"]').clear().type("Neuer Name");
      cy.get('[data-cy="edit-event-description-input"]').clear().type("Neue Beschreibung");
      cy.get('[data-cy="edit-event-save-button"]').click();
    });

    cy.contains('[data-cy="event-card"]', "Neuer Name").should("be.visible");
    cy.contains('[data-cy="event-card"]', "Neue Beschreibung").should("be.visible");
    cy.contains('[data-cy="event-card"]', "Altes Event").should("not.exist");
  });

  it("bricht das Bearbeiten ab, ohne die Aenderungen zu speichern", () => {
    cy.get('[data-cy="new-event-open-button"]').click();
    cy.get('[data-cy="new-event-name-input"]').type("Unveraendertes Event");
    cy.get('[data-cy="new-event-submit-button"]').click();

    cy.contains('[data-cy="event-card"]', "Unveraendertes Event").within(() => {
      cy.get('[data-cy="edit-event-button"]').click();
      cy.get('[data-cy="edit-event-name-input"]').clear().type("Sollte nicht gespeichert werden");
      cy.get('[data-cy="edit-event-cancel-button"]').click();
    });

    cy.contains('[data-cy="event-card"]', "Unveraendertes Event").should("be.visible");
    cy.contains("Sollte nicht gespeichert werden").should("not.exist");
  });

  it("löscht ein Event erst nach Bestätigung", () => {
    cy.get('[data-cy="new-event-open-button"]').click();
    cy.get('[data-cy="new-event-name-input"]').type("Zu löschendes Event");
    cy.get('[data-cy="new-event-submit-button"]').click();
    cy.contains('[data-cy="event-card"]', "Zu löschendes Event").should("be.visible");

    // Abbrechen im Bestaetigungsdialog darf das Event nicht loeschen.
    cy.contains('[data-cy="event-card"]', "Zu löschendes Event").within(() => {
      cy.get('[data-cy="delete-event-button"]').click();
    });
    cy.get('[data-cy="confirm-dialog-cancel"]').click();
    cy.contains('[data-cy="event-card"]', "Zu löschendes Event").should("be.visible");

    // Bestaetigen loescht es tatsaechlich.
    cy.contains('[data-cy="event-card"]', "Zu löschendes Event").within(() => {
      cy.get('[data-cy="delete-event-button"]').click();
    });
    cy.get('[data-cy="confirm-dialog-confirm"]').click();
    cy.contains('[data-cy="event-card"]', "Zu löschendes Event").should("not.exist");
  });
});