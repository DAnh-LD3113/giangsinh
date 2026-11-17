"use strict";

(() => {
  // The Next.js parent already owns analytics when this page is embedded.
  // Downloaded copies and local previews must not send visits to production GA.
  if (window.self !== window.top || location.protocol !== "https:" ||
      !["vuicoding.me", "www.vuicoding.me"].includes(location.hostname)) return;
  if (document.getElementById("noel-google-analytics")) return;

  const measurementId = "G-9C596LLS4D";
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    // Group shared music links under Noel without sending personal greetings.
    page_location: `${location.origin}/noel/`,
    page_title: document.title,
  });

  const script = document.createElement("script");
  script.id = "noel-google-analytics";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
})();
