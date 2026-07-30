// E2E-Test fuer Projekt-CRUD innerhalb eines Events (anlegen, bearbeiten,
// loeschen mit Bestaetigung). Frischer Nutzer pro Testlauf, siehe events.cy.js.
function registerAndLoginWithEvent(eventName) {
  const email = `projects-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;
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

  // Projekte gehoeren immer zu einem Event - erst eines anlegen, das als
  // Container fuer die eigentlichen Tests dient.
  cy.get('[data-cy="new-event-open-button"]').click();
  cy.get('[data-cy="new-event-name-input"]').type(eventName);
  cy.get('[data-cy="new-event-submit-button"]').click();
  cy.contains('[data-cy="event-card"]', eventName).should("be.visible");
}

describe("Projekt innerhalb eines Events verwalten", () => {
  const EVENT_NAME = "Produktlaunch";

  beforeEach(() => {
    cy.clearCookies();
    registerAndLoginWithEvent(EVENT_NAME);
  });

  it("legt ein neues Projekt mit Name und Beschreibung an", () => {
    cy.contains('[data-cy="event-card"]', EVENT_NAME).within(() => {
      cy.get('[data-cy="new-project-open-button"]').click();
      cy.get('[data-cy="new-project-name-input"]').type("Marketingkampagne");
      cy.get('[data-cy="new-project-description-input"]').type("Kampagne ueber alle Kanaele");
      cy.get('[data-cy="new-project-submit-button"]').click();
    });

    cy.contains('[data-cy="project-item"]', "Marketingkampagne").should("be.visible");
  });

  it("bearbeitet Name und Beschreibung eines bestehenden Projekts", () => {
    cy.contains('[data-cy="event-card"]', EVENT_NAME).within(() => {
      cy.get('[data-cy="new-project-open-button"]').click();
      cy.get('[data-cy="new-project-name-input"]').type("Altes Projekt");
      cy.get('[data-cy="new-project-submit-button"]').click();
    });
    cy.contains('[data-cy="project-item"]', "Altes Projekt").should("be.visible");

    cy.contains('[data-cy="project-item"]', "Altes Projekt").within(() => {
      cy.get('[data-cy="edit-project-button"]').click();
      cy.get('[data-cy="edit-project-name-input"]').clear().type("Neues Projekt");
      cy.get('[data-cy="edit-project-description-input"]').clear().type("Neue Beschreibung");
      cy.get('[data-cy="edit-project-save-button"]').click();
    });

    cy.contains('[data-cy="project-item"]', "Neues Projekt").should("be.visible");
    cy.contains('[data-cy="project-item"]', "Neue Beschreibung").should("be.visible");
    cy.contains('[data-cy="project-item"]', "Altes Projekt").should("not.exist");
  });

  it("löscht ein Projekt erst nach Bestätigung", () => {
    cy.contains('[data-cy="event-card"]', EVENT_NAME).within(() => {
      cy.get('[data-cy="new-project-open-button"]').click();
      cy.get('[data-cy="new-project-name-input"]').type("Zu löschendes Projekt");
      cy.get('[data-cy="new-project-submit-button"]').click();
    });
    cy.contains('[data-cy="project-item"]', "Zu löschendes Projekt").should("be.visible");

    // Abbrechen darf das Projekt nicht loeschen.
    cy.contains('[data-cy="project-item"]', "Zu löschendes Projekt").within(() => {
      cy.get('[data-cy="delete-project-button"]').click();
    });
    cy.get('[data-cy="confirm-dialog-cancel"]').click();
    cy.contains('[data-cy="project-item"]', "Zu löschendes Projekt").should("be.visible");

    // Bestaetigen loescht es tatsaechlich.
    cy.contains('[data-cy="project-item"]', "Zu löschendes Projekt").within(() => {
      cy.get('[data-cy="delete-project-button"]').click();
    });
    cy.get('[data-cy="confirm-dialog-confirm"]').click();
    cy.contains('[data-cy="project-item"]', "Zu löschendes Projekt").should("not.exist");
  });
});