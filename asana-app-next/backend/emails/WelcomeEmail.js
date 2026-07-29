// Kein JSX: dieses Backend hat keine JSX-Transform-Pipeline (reines ESM,
// kein Babel/SWC). React.createElement() ist die JSX-freie Entsprechung und
// funktioniert ohne zusaetzliche Build-Tools.
import React from "react";
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";

const e = React.createElement;

export function WelcomeEmail({ name, loginUrl }) {
  return e(
    Html,
    null,
    e(Head, null),
    e(Preview, null, `Willkommen, ${name}!`),
    e(
      Body,
      { style: { fontFamily: "sans-serif", backgroundColor: "#f5ede4", padding: "24px" } },
      e(
        Container,
        {
          style: {
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "32px",
            maxWidth: "480px",
          },
        },
        e(Heading, { style: { color: "#213745", fontSize: "20px" } }, `Willkommen, ${name}!`),
        e(
          Text,
          { style: { color: "#213745", fontSize: "14px", lineHeight: "1.5" } },
          "Dein Konto wurde erfolgreich erstellt. Du kannst ab sofort deine Events und Projekte verwalten."
        ),
        e(
          Button,
          {
            href: loginUrl,
            style: {
              backgroundColor: "#ff5b8e",
              color: "#ffffff",
              padding: "12px 24px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              textDecoration: "none",
              display: "inline-block",
              marginTop: "16px",
            },
          },
          "Zu meinen Events"
        )
      )
    )
  );
}