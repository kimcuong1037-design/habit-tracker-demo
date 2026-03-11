/**
 * Service Worker — Habit Tracker Reminder (DD-014)
 *
 * Receives SHOW_REMINDER messages from main thread and displays
 * OS-level notifications even when the app tab is in background.
 */

self.addEventListener("message", (event) => {
  if (event.data?.type === "SHOW_REMINDER") {
    const { title, body } = event.data.payload;
    self.registration.showNotification(title || "Habit Tracker", {
      body,
      tag: "habit-reminder",
      icon: "/favicon.svg",
    });
  }
});

// Click notification → focus the app tab
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow("/");
    }),
  );
});
