if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch(() => {
      document.documentElement.dataset.serviceWorker = "failed";
    });
  });
}
