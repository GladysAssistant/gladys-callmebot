# CallMeBot

Send Gladys notifications to **WhatsApp** or **Signal** through the free
[CallMeBot](https://www.callmebot.com) API.

This is a **send-only notification channel**: Gladys uses it to deliver its
messages (scenario notifications, alerts…) to your phone. There is no incoming
path — you cannot talk back to Gladys through it.

## Get your API key

CallMeBot requires a one-time activation per messaging service, from the phone
that will receive the messages:

### WhatsApp

1. Add the CallMeBot number to your contacts (the up-to-date number is on the
   [official guide](https://www.callmebot.com/blog/free-api-whatsapp-messages/)).
2. Send it the message `I allow callmebot to send me messages` on WhatsApp.
3. The bot replies with your personal **API key**.

### Signal

1. Follow the [official Signal guide](https://www.callmebot.com/blog/free-api-signal-send-messages/):
   you add the CallMeBot Signal number and send it the activation message.
2. The bot replies with your personal **API key**.

## Configuration

Each Gladys user configures their own account (the credentials are per-user,
not shared):

1. Open the **Configuration** tab of the integration.
2. In the **My account** block, pick your **messaging service** (WhatsApp or
   Signal), enter your **phone number** in international format
   (e.g. `+33612345678`) and paste your **CallMeBot API key**.
3. Save. Gladys now delivers this user's notifications through CallMeBot.

## Usage

Use the **Send a message** action in your scenarios, or anything else that
makes Gladys notify a user: if the user has CallMeBot credentials configured,
the message shows up on their WhatsApp or Signal.

## Troubleshooting

- **No message received**: check the integration logs from the Gladys UI (or
  `docker logs` on the host). A `Failed to send message` error contains the
  answer of the CallMeBot API (invalid API key, unregistered phone number…).
- **The first message is slow**: CallMeBot is a free shared service; a delivery
  can take a few seconds.
- Messages are text-only: attached images are not supported by the CallMeBot
  API and only the text of the notification is delivered.
