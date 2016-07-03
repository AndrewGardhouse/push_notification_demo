// Here we are adding a 'push' event listener to our service worker
// This will display a notification with the predefined title, body, icon and tag.
self.addEventListener('push', function(event) {
  console.log('Recieved a push message', event);

  var title = 'Invoke Media',
       body = 'You have recieved a push message',
       icon = '/icon.jpeg',
        tag = 'push-notification-demo-tag';

  // The event.waitUntil() method takes in a promise and keeps the service worker alive (or extends the life of an event handler) until the promise is settled (either fulfilled or rejected, but not pending).
  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: icon,
      // tag: tag
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var url = "https://www.invokemedia.com/"
  event.waitUntil(
    clients.matchAll({
      type: 'window'
    }).then(function(windowClients) {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === url && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
});
