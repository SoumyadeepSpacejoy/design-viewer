// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";

// Applied before first paint so a saved theme doesn't flash the default one.
const THEME_SCRIPT = `
try {
  var t = localStorage.getItem("theme") || "dark";
  var r = t === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : t;
  document.documentElement.classList.add(r);
} catch (e) {
  document.documentElement.classList.add("dark");
}
`;

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/icon.svg" />
          <link rel="apple-touch-icon" href="/icon.svg" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap"
          />
          {assets}
        </head>
        <body class="antialiased">
          <script innerHTML={THEME_SCRIPT} />
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));
