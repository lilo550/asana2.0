// E2E-Test fuer die oeffentliche Landingpage. Prueft, dass sie ohne Session
// erreichbar ist (im Gegensatz zum geschuetzten /dashboard) und dass beide
// CTAs reibungslos zur Registrierung fuehren.
describe("Landingpage", () => {
  beforeEach(() => {
    cy.clearCookies();
  });

  it("ist ohne Login erreichbar und zeigt beide CTAs", () => {
    cy.visit("/");

    cy.url().should("eq", `${Cypress.config("baseUrl")}/`);
    cy.get('[data-cy="landing-cta-primary"]').should("be.visible");
    cy.get('[data-cy="landing-cta-secondary"]').should("be.visible");
  });

  it("fuehrt vom primaeren CTA direkt zur Registrierung", () => {
    cy.visit("/");

    cy.get('[data-cy="landing-cta-primary"]').click();

    cy.url().should("eq", `${Cypress.config("baseUrl")}/register`);
  });

  it("fuehrt vom sekundaeren CTA am Seitenende ebenfalls zur Registrierung", () => {
    cy.visit("/");

    cy.get('[data-cy="landing-cta-secondary"]').click();

    cy.url().should("eq", `${Cypress.config("baseUrl")}/register`);
  });
});