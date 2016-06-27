var isPushEnabled = false,
    gcmAPIKey = "AIzaSyA3Km61lQsPvkwP9OlH16wxoW5BqHkY-eI";

function showCurlCommand(subscription) {
  var codeSnippet = document.getElementById('curlCommand');
  var subscriptionId = getSubscriptionId(subscription);

  codeSnippet.innerHTML = 'curl --header "Authorization: key=' + gcmAPIKey + '" --header "Content-Type: application/json"  https://android.googleapis.com/gcm/send -d "{\\\"registration_ids\\\":[\\\"' + subscriptionId + '\\\"]}"'
}

function getSubscriptionId(subscription) {
  return subscription.endpoint.split('/').pop();
}

function initializeState() {
  // Checks if notifications are supported in the service worker
  if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
    console.warn('Notifications are not supported.');
    return;
  }

  // Checks the current Notifications permission
  // If the permission is denied, it is blocked until the user changes the notification permission
  if (Notification.permission === 'denied') {
    console.warn('The user has blocked notifications');
    return;
  }

  // Checks if push messages are supported
  if (!('PushManager' in window)) {
    console.warn('Push messaging is not supported in the browser');
    return;
  }

  // The service worker registration is checking for a subscription to push messages
  navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {

    // pushManager.getSubscription() is used to check if there is already a subscription and uses that info to set the state of the Switch
    serviceWorkerRegistration.pushManager.getSubscription()
      .then(function(subscription) {

        // Enable switch which subscribes/unsubscribes from push messages
        var pushSwitch = document.querySelector('#push-switch');
        var pushSwitchLabel = document.querySelector('.push-switch');
        var pushSwitchSpan = document.querySelector('.mdl-switch__label');
        pushSwitchLabel.classList.remove('is-disabled');
        pushSwitch.disabled = false;

        if (!subscription) {
          // Since there is no subscription (the user has not subscribed to push messages)
          // The switch is set up to allow the user to subscribe
          console.log('The user has not subscribed to push messages')
          return;
        }

        // Keeps the server in sync with the latest subscriptionId
        // sendSubscriptionToServer(subscription);

        console.log(subscription)
        showCurlCommand(subscription)
        // Sets your switch to show they have subscribed for push messages
        pushSwitchSpan.textContent = 'Disable Push Messages';
        pushSwitchLabel.classList.add('is-checked');
        // pushSwitch.checked = true;

        isPushEnabled = true;
      })
      .catch(function(error) {
        console.warn('There was an error during getSubscription()', error);
      })
  })
}

// This function subscribes the user for push messages
function subscribe() {

  // The switch is temporarily disabled while the request is being processed
  var pushSwitch = document.querySelector('#push-switch');
  var pushSwitchLabel = document.querySelector('.push-switch');
  var pushSwitchSpan = document.querySelector('.mdl-switch__label');
  pushSwitch.disabled = true;

  navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
    // The 'userVisibleOnly' option needs to be set to true because Chrome currently only supports Push API subscriptions that result in user-visible messages
    serviceWorkerRegistration.pushManager.subscribe({userVisibleOnly: true})
      .then(function(subscription) {
        // The subscribition was successful
        isPushEnabled = true;
        pushSwitchSpan.textContent = 'Disable Push Messages';
        pushSwitchLabel.classList.remove('is-disabled');
        pushSwitch.disabled = false;

        console.log('The user has successfully subscribed to push messages');
        // TODO: Send the subscription.endpoint to your server and save it to send a push message at a later date
        // return sendSubscriptionToServer(subscription);

        showCurlCommand(subscription)
      })
      .catch(function(error) {
        if (Notification.permission === 'denied') {
          // At this point, the user has denied the notifications permission and will have to manually change the Notification permission to subscribe to push notifications
          console.warn('Permission for notifications was denied');
          pushSwitch.disabled = true;
          pushSwitchLabel.classList.remove('is-checked');
        } else {
          // A problem occurred with the subscription. Common reasons include network errors, and lacking gcm_sender_id
          console.error('Unable to subscribe to push', error)
          pushSwitch.disabled = false;
          pushSwitchLabel.classList.remove('is-disabled');
          pushSwitchLabel.classList.remove('is-checked');
          pushSwitchSpan.textContent = 'Enable Push Messages';
        }
      })
  });
}

// This function unsubscribes the user for push messages
function unsubscribe() {
  // The switch is temporarily disabled while the request is being processed
  var pushSwitch = document.querySelector('#push-switch');
  var pushSwitchLabel = document.querySelector('.push-switch');
  var pushSwitchSpan = document.querySelector('.mdl-switch__label');
  pushSwitch.disabled = true;

  navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
    // To unsubscribe from push messages, you need the subscription object that will get unsubscribed() called on
    serviceWorkerRegistration.pushManager.getSubscription()
    .then(function(pushSubscription) {
      if (!pushSubscription) {
        // Since there is no subscription object, the state of the switch is set to allow the user to subscribe to push messaging
        isPushEnabled = false;
        pushSwitch.disabled = false;
        pushSwitchLabel.classList.remove('is-checked');
        pushSwitchSpan.textContent = 'Enable Push Messages';
        return;
      }

       // TODO: Make a request to your server to remove
       // the subscriptionId from your data store so you
       // don't attempt to send them push messages anymore

       pushSubscription.unsubscribe()
       .then(function(success) {
         console.log('Success', success)
         isPushEnabled = false;
         pushSwitch.disabled = false;
         pushSwitchLabel.classList.remove('is-checked', 'is-disabled');
         pushSwitchSpan.textContent = 'Enable Push Messages';

         var codeSnippet = document.getElementById('curlCommand');
         codeSnippet.innerHTML = "";
       })
       .catch(function(error) {
         // We failed to unsubscribe, this can lead to
         // an unusual state, so may be best to remove
         // the users data from your data store and
         // inform the user that you have done so

         console.log('Unsubscription error: ', error);
         pushSwitch.disabled = false;
         pushSwitchLabel.classList.remove('is-checked', 'is-disabled');
         pushSwitchSpan.textContent = 'Enable Push Messages';
       })
    })
    .catch(function(error) {
      console.error('There was an error thrown while unsubscribing from push messaging.', error);
    })
  })
}

window.addEventListener('load', function() {
  var pushSwitch = document.querySelector('#push-switch');
  pushSwitch.addEventListener('click', function() {
    console.log('clicked')
    if (isPushEnabled) {
      unsubscribe();
    } else {
      subscribe();
    }
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
    .then(initializeState);
  } else {
    console.warn('Service workers are not supported in this browser.')
  }
});
