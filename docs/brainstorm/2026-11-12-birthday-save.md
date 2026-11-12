# Birthday-save

## Objectif

Retrouver les anniversaires de ses proches dans un calendrier et recevoir, chaque année, des rappels aux jours et heures choisis. La première version doit fonctionner sur le téléphone, hors ligne et sans compte.

## Parcours principal

1. Depuis **À venir** ou **Calendrier**, appuyer sur **Ajouter un anniversaire**.
2. Saisir le prénom ou le surnom et la date. L’année de naissance est facultative.
3. Garder les rappels par défaut, les personnaliser ou les désactiver pour cette personne.
4. Vérifier les prochaines dates et heures affichées, puis enregistrer. L’application demande l’autorisation de notifier au moment d’activer les rappels.
5. Un appui sur une notification ouvre la fiche de la personne.

| Fiche | Rappel la veille | Rappel le jour même |
| --- | --- | --- |
| Maman, 2 février | 1ᵉʳ février à 19 h | 2 février à 6 h |
| Ami, 18 août | Désactivé | 18 août à 8 h |

Les horaires de Maman peuvent servir de réglages par défaut. La fiche peut hériter de ces réglages, les remplacer ou désactiver ses rappels. Un changement des valeurs par défaut s’applique aux fiches qui en héritent.

## Première version

- **À venir** présente les prochains anniversaires dans l’ordre, avec le nombre de jours restants et l’âge à venir si l’année de naissance est connue.
- **Calendrier** propose une vue mensuelle avec des jours marqués et la liste des personnes pour la date sélectionnée.
- **Fiche anniversaire** permet d’ajouter, de modifier et de supprimer une personne, ainsi que d’activer jusqu’à deux rappels avec des heures indépendantes. Une note facultative peut servir à conserver une idée de cadeau.
- **Paramètres** permet de régler les deux horaires par défaut et affiche l’état des autorisations. En cas de refus, les anniversaires restent enregistrés et l’interface affiche que les rappels sont inactifs.

Une exportation et une restauration de sauvegarde pourront venir ensuite, puis l’import de contacts ou la synchronisation si ces besoins se confirment.

## Approche recommandée

| Approche | Avantage | Effort et compromis |
| --- | --- | --- |
| React Native, Expo et notifications locales | Rappels hors ligne et données sur le téléphone | Effort initial modéré. Tester la ponctualité sur Android et gérer les autorisations. |
| React Native, serveur et notifications push | Données et préférences partageables entre appareils | Effort supérieur. Ajouter les comptes et le serveur, avec une connexion nécessaire à la réception des notifications distantes. |

Commencer par **React Native, Expo et TypeScript**, avec Android comme première cible proposée. Utiliser [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) pour les fiches et les préférences et [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) pour la programmation locale. Expo Go permet les premiers essais de notifications locales. Une version de développement installée sur le téléphone permet ensuite de tester la configuration native de Birthday-save. [Versions de développement Expo](https://docs.expo.dev/develop/development-builds/introduction/)

### Programmation des rappels

- Stocker le jour, le mois et l’année facultative séparément. Conserver les heures comme heures locales du téléphone. Calculer la veille en jours calendaires pour que le 1ᵉʳ janvier donne bien le 31 décembre.
- Utiliser un déclencheur annuel Expo pour les rappels dont le jour et le mois restent fixes. Par exemple, la fiche de Maman déclenche deux notifications récurrentes, aux 1ᵉʳ et 2 février.
- Associer les notifications programmées aux règles qui les ont créées. À la modification, la désactivation ou la suppression, annuler les anciens rappels et appliquer les nouveaux réglages. Vérifier les notifications programmées à la réouverture pour corriger une programmation interrompue et éviter les doublons.
- Le **29 février** exige une règle produit. Proposition à valider, retenir le 28 février les années non bissextiles. La veille d’un anniversaire du 1ᵉʳ mars varie aussi selon l’année. Ces rappels demandent un calcul par année, distinct du déclencheur annuel à date fixe. Un horizon pluriannuel de notifications ponctuelles est une piste à tester. Avec cette piste, il faut renouveler l’horizon à la réouverture de l’application.
- La ponctualité dépend des autorisations et de la configuration Android. Si l’accès aux alarmes exactes manque, indiquer que l’heure peut être approximative quand la programmation a abouti en mode standard. Si aucun rappel n’a été programmé, le signaler sur la fiche. [Alarmes Android](https://developer.android.com/develop/background-work/services/alarms)

## Ordre de réalisation

1. Sur un vrai téléphone Android, programmer deux notifications à quelques minutes d’intervalle. Quitter l’application normalement, couper le réseau et verrouiller l’écran. Vérifier l’arrivée des deux rappels. Refaire l’essai après redémarrage et après modification ou suppression d’un rappel.
2. Vérifier la prochaine occurrence des déclencheurs annuels par calcul, notamment après l’heure du jour et au passage du 31 décembre au 1ᵉʳ janvier. Tester aussi la règle proposée pour les années bissextiles.
3. Relier les fiches et réglages à la programmation des notifications. Construire ensuite **À venir** et **Calendrier** sur les mêmes données.
4. Valider le parcours complet avec deux personnes qui ont des réglages différents. Les horaires affichés doivent correspondre aux rappels programmés, et une modification ou suppression ne doit laisser aucun rappel obsolète.

Le premier jalon est de recevoir les deux notifications d’essai sur le téléphone avec l’écran verrouillé.
