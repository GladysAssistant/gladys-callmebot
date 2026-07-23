# CallMeBot

Envoyez les notifications de Gladys sur **WhatsApp** ou **Signal** via l'API
gratuite [CallMeBot](https://www.callmebot.com).

C'est un **canal de notification en envoi seul** : Gladys l'utilise pour
délivrer ses messages (notifications de scénarios, alertes…) sur votre
téléphone. Il n'y a pas de voie retour — impossible de répondre à Gladys par
ce canal.

## Obtenir votre clé d'API

CallMeBot demande une activation unique par service de messagerie, depuis le
téléphone qui recevra les messages :

### WhatsApp

1. Ajoutez le numéro CallMeBot à vos contacts (le numéro à jour se trouve sur
   le [guide officiel](https://www.callmebot.com/blog/free-api-whatsapp-messages/)).
2. Envoyez-lui le message `I allow callmebot to send me messages` sur WhatsApp.
3. Le bot vous répond avec votre **clé d'API** personnelle.

### Signal

1. Suivez le [guide officiel Signal](https://www.callmebot.com/blog/free-api-signal-send-messages/) :
   vous ajoutez le numéro Signal de CallMeBot et lui envoyez le message
   d'activation.
2. Le bot vous répond avec votre **clé d'API** personnelle.

## Configuration

Chaque utilisateur de Gladys configure son propre compte (les identifiants
sont individuels, pas partagés) :

1. Ouvrez l'onglet **Configuration** de l'intégration.
2. Dans le bloc **Mon compte**, choisissez votre **service de messagerie**
   (WhatsApp ou Signal), renseignez votre **numéro de téléphone** au format
   international (ex. `+33612345678`) et collez votre **clé d'API CallMeBot**.
3. Enregistrez. Gladys délivre désormais les notifications de cet utilisateur
   via CallMeBot.

## Utilisation

Utilisez l'action **Envoyer un message** dans vos scénarios, ou tout ce qui
amène Gladys à notifier un utilisateur : si l'utilisateur a configuré ses
identifiants CallMeBot, le message arrive sur son WhatsApp ou son Signal.

## Dépannage

- **Aucun message reçu** : consultez les logs de l'intégration depuis
  l'interface de Gladys (ou `docker logs` sur l'hôte). Une erreur
  `Failed to send message` contient la réponse de l'API CallMeBot (clé d'API
  invalide, numéro non enregistré…).
- **Le premier message est lent** : CallMeBot est un service gratuit partagé ;
  une livraison peut prendre quelques secondes.
- Les messages sont uniquement du texte : les images jointes ne sont pas
  prises en charge par l'API CallMeBot, seul le texte de la notification est
  délivré.
