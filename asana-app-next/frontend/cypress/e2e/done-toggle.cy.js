// E2E-Test fuer die Erledigt-Regel: ein Event darf erst als erledigt markiert
// werden, wenn alle seine Projekte erledigt sind, und wird automatisch wieder
// geoeffnet, sobald eines seiner Projekte erneut geoeffnet wird. Frischer
// Nutzer pro Testlauf, siehe events.cy.js.
const EVENT_NAME = "Konferenz";

function setUpEventWithTwoProjects() {
  const email = `done-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;
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

  cy.get('[data-cy="new-event-open-button"]').click();
  cy.get('[data-cy="new-event-name-input"]').type(EVENT_NAME);
  cy.get('[data-cy="new-event-submit-button"]').click();
  cy.contains('[data-cy="event-card"]', EVENT_NAME).should("be.visible");

  cy.contains('[data-cy="event-card"]', EVENT_NAME).within(() => {
    cy.get('[data-cy="new-project-open-button"]').click();
    cy.get('[data-cy="new-project-name-input"]').type("Projekt A");
    cy.get('[data-cy="new-project-submit-button"]').click();

    cy.get('[data-cy="new-project-open-button"]').click();
    cy.get('[data-cy="new-project-name-input"]').type("Projekt B");
    cy.get('[data-cy="new-project-submit-button"]').click();
  });
}

describe("Erledigt-Status für Events und Projekte", () => {
  beforeEach(() => {
    cy.clearCookies();
    setUpEventWithTwoProjects();
  });

  it("Event laesst sich erst als erledigt markieren, wenn alle Projekte erledigt sind", () => {
    cy.contains('[data-cy="event-card"]', EVENT_NAME).within(() => {
      // Beide Projekte offen: Event-Button ist gesperrt.
      cy.get('[data-cy="toggle-event-done"]').should("be.disabled");

      cy.contains('[data-cy="project-item"]', "Projekt A").within(() => {
        cy.get('[data-cy="toggle-project-done"]').click();
      });
      // Ein Projekt noch offen: weiterhin gesperrt.
      cy.get('[data-cy="toggle-event-done"]').should("be.disabled");

      cy.contains('[data-cy="project-item"]', "Projekt B").within(() => {
        cy.get('[data-cy="toggle-project-done"]').click();
      });
      // Alle Projekte erledigt: jetzt klickbar.
      cy.get('[data-cy="toggle-event-done"]').should("not.be.disabled").click();
      cy.get('[data-cy="toggle-event-done"]').should("contain.text", "Erledigt");
    });
  });

  it("Event wird automatisch wieder geöffnet, wenn ein Projekt erneut geöffnet wird", () => {
    cy.contains('[data-cy="event-card"]', EVENT_NAME).within(() => {
      cy.contains('[data-cy="project-item"]', "Projekt A").within(() => {
        cy.get('[data-cy="toggle-project-done"]').click();
      });
      cy.contains('[data-cy="project-item"]', "Projekt B").within(() => {
        cy.get('[data-cy="toggle-project-done"]').click();
      });
      cy.get('[data-cy="toggle-event-done"]').click();
      cy.get('[data-cy="toggle-event-done"]').should("contain.text", "Erledigt");

      // Projekt A wieder oeffnen -> Event darf nicht laenger "erledigt" sein.
      cy.contains('[data-cy="project-item"]', "Projekt A").within(() => {
        cy.get('[data-cy="toggle-project-done"]').click();
      });
      cy.get('[data-cy="toggle-event-done"]').should("contain.text", "Offen");
    });
  });
});