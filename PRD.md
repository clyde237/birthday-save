# PRD — Birthday-save

**Version 0.1 · 12 novembre 2026 · Plan de développement du MVP**

[Cadrage initial](docs/brainstorm/2026-11-12-birthday-save.md)

## 1. Objectif

Birthday-save aide une personne à enregistrer les anniversaires de ses proches, à les retrouver dans un calendrier et à recevoir des rappels annuels aux heures qui lui conviennent. Le premier livrable est une application Android utilisable en français, hors ligne et sans compte.

Le scénario de référence est l’anniversaire de **Maman, le 2 février**. Après avoir créé sa fiche, l’utilisateur peut recevoir un rappel le **1ᵉʳ février à 19 h** et un autre le **2 février à 6 h**, chaque année. Il peut appliquer des horaires différents à une autre personne. La validation combine la réception réelle de notifications sur un téléphone et la vérification du calcul des prochaines occurrences annuelles.

## 2. Périmètre du MVP

| Écran | Ce que l’utilisateur peut faire |
| --- | --- |
| À venir | Consulter les prochains anniversaires par ordre chronologique, voir le nombre de jours restants et l’âge à venir quand l’année est connue, ouvrir ou ajouter une fiche. |
| Calendrier | Changer de mois, repérer les dates avec des anniversaires, sélectionner un jour et ouvrir une des fiches associées. |
| Fiche anniversaire | Saisir un nom ou un surnom, le jour et le mois, une année de naissance et une note facultatives. Modifier ou supprimer la fiche et vérifier les prochains rappels. |
| Paramètres | Modifier les rappels par défaut, consulter l’état des autorisations et accéder aux réglages Android si nécessaire. |

L’export et la restauration des données, l’import des contacts, la synchronisation entre appareils, la publication sur le Play Store et la validation iOS sont prévus pour des étapes ultérieures si le besoin se confirme.

## 3. Règles produit

### Fiches et calendrier

- Le nom, le jour et le mois sont obligatoires. Une date impossible ou une date de naissance future empêche l’enregistrement et le champ concerné affiche une erreur. Plusieurs personnes peuvent partager la même date.
- Le calendrier et la liste **À venir** reposent sur les mêmes fiches. Un anniversaire du jour reste affiché comme **Aujourd’hui**, même si son dernier rappel est déjà passé.
- L’âge affiché est celui que la personne atteint à la prochaine occurrence affichée. Il est omis lorsque l’année de naissance est inconnue.

### Rappels

- Chaque fiche propose trois choix **Réglages par défaut**, **Personnalisés** ou **Désactivés**. En mode personnalisé, les deux rappels s’activent indépendamment et ont chacun une heure réglable. Les valeurs initiales proposées sont **la veille à 19 h** et **le jour même à 6 h**, en heure locale du téléphone.
- Une modification des valeurs globales reprogramme uniquement les fiches qui en héritent. Une modification, désactivation ou suppression d’une fiche annule ses rappels devenus obsolètes. L’application programme uniquement les prochaines occurrences futures.
- La veille se calcule en jours calendaires. Pour un anniversaire le 1ᵉʳ janvier, elle tombe le 31 décembre précédent. La règle de travail proposée pour le 29 février est le 28 février les années non bissextiles. La veille du 1ᵉʳ mars doit aussi changer selon l’année.
- L’application demande l’autorisation de notifier au moment d’activer le premier rappel. En cas de refus, la fiche et les réglages restent enregistrés. L’écran distingue les rappels programmés, les rappels désactivés, les notifications bloquées et les échecs de programmation. Si Android accepte une programmation approximative, l’interface l’indique.
- Un appui sur une notification ouvre la fiche même si l’application doit démarrer. Si la fiche a été supprimée depuis l’affichage de la notification, l’application ouvre **À venir**.

## 4. Lots de développement

P0 regroupe les fonctions nécessaires à la validation du MVP. Le lot 1 commence par vérifier la livraison réelle des notifications. Le travail sur les règles de dates peut avancer pendant cet essai.

| Ordre | Priorité | Travail à développer | Critères d’acceptation | Dépendances |
| --- | --- | --- | --- | --- |
| 1 · Prototype Android | P0 | Initialiser Expo et TypeScript. Préparer une version de développement et un écran temporaire de test pour programmer et annuler deux rappels. | Sur un vrai Android, les deux notifications arrivent hors ligne, écran verrouillé, après avoir quitté l’application normalement. Tester aussi un redémarrage avant l’heure prévue, le refus des notifications et l’accès aux alarmes exactes. Consigner l’heure prévue, l’heure observée et la configuration. | Téléphone Android pour la validation |
| 2 · Fiches et calcul des dates | P0 | Créer le stockage SQLite, l’écran de fiche, la validation de saisie et le calcul des anniversaires et rappels. | Une fiche sans année reste disponible après fermeture et relance. La modification et la suppression persistent. Les calculs passent pour le 2 février, le 1ᵉʳ janvier, le 29 février et le 1ᵉʳ mars en année bissextile et ordinaire. | Initialisation du projet |
| 3 · Réglages et programmation | P0 | Créer les préférences globales, les choix par fiche, l’aperçu des prochaines occurrences et le service de notifications. | Maman hérite de deux rappels. Un ami reçoit seulement celui du jour même à 8 h. Modifier les valeurs globales affecte uniquement Maman. Une modification, une suppression ou une nouvelle tentative après échec ne laisse aucun doublon ni rappel obsolète. Une permission rétablie permet de programmer les rappels attendus. | Lots 1 et 2 |
| 4 · Consultation | P0 | Construire **À venir**, le calendrier mensuel et la navigation vers les fiches. | Deux fiches sur la même date apparaissent ensemble dans le calendrier. Les prochaines dates sont triées correctement au changement d’année. Depuis une notification, la bonne fiche s’ouvre avec l’application déjà lancée ou au démarrage. | Lot 2 pour les vues, lot 3 pour l’ouverture depuis une notification |
| 5 · Validation du MVP | P0 | Exécuter le parcours complet sur une installation Android de Birthday-save et consigner les résultats. | Créer deux fiches, contrôler leurs horaires, quitter et relancer l’application, recevoir les rappels d’essai, modifier une heure puis supprimer une fiche. Vérifier la liste des notifications programmées et l’état affiché en cas de refus ou d’échec. | Lots 1 à 4 |

### Premier lot à lancer

1. Créer le squelette Expo avec TypeScript et ajouter `expo-notifications`.
2. Sur un Android physique, programmer un rappel à court terme et un déclencheur annuel dont la prochaine occurrence est proche. Vérifier aussi que la prochaine date calculée passe à l’année suivante après l’heure prévue.
3. Refaire un essai hors ligne avec le téléphone verrouillé, puis un essai avec redémarrage avant la livraison. Modifier ou annuler un rappel avant son échéance et vérifier le résultat.
4. Relever le comportement avec et sans accès aux alarmes exactes. Utiliser ce résultat pour définir les états affichés et la manière de rétablir la programmation dans le lot 3.

## 5. Architecture et décisions ouvertes

| Composant | Responsabilité |
| --- | --- |
| React Native, Expo et TypeScript | Écrans, navigation et parcours mobile Android. Expo Go sert aux premiers essais locaux. La version de développement sert à vérifier la configuration native de Birthday-save. |
| SQLite avec `expo-sqlite` | Fiches, préférences et état de la programmation. Le jour et le mois sont enregistrés séparément de l’année facultative. |
| Calcul des dates | Une logique commune fournit les dates du calendrier, l’ordre de la liste et les échéances des rappels. Elle se vérifie indépendamment de l’interface. |
| Service de notifications avec `expo-notifications` | Programme les rappels, associe les identifiants de notification aux fiches et rapproche les réglages enregistrés des notifications réelles à la réouverture et au retour des paramètres Android. |

Pour les dates fixes, privilégier le déclencheur annuel d’Expo. Pour les échéances qui varient selon l’année, vérifier comment conserver la récurrence au fil des ans, y compris quand l’application reste inutilisée. L’horizon pluriannuel de notifications ponctuelles évoqué au cadrage est une option de prototype. S’il exige une réouverture pour prolonger la programmation, expliciter cette limite et décider de son acceptabilité avant de valider le MVP.

Android est la première cible de travail. Les heures par défaut et le report du 29 au 28 février sont des propositions produit. La ponctualité, le comportement après redémarrage et la stratégie de récurrence des dates variables doivent être vérifiés sur l’appareil avant de figer les engagements du MVP.

## 6. Conditions de validation

- Les fonctionnalités P0 satisfont leurs critères d’acceptation. Le contrôle TypeScript passe et les vérifications automatisées couvrent les changements d’année, les dates bissextiles et le calcul des horaires par fiche.
- Le scénario de référence est vérifié sur une version installée de Birthday-save, avec l’appareil, la version Android, les autorisations et les résultats consignés.
- Les échecs de programmation et les restrictions d’Android restent visibles pour l’utilisateur. La gestion des dates variables est vérifiée et la limite éventuelle de récurrence est documentée.

## Références techniques

Documentation consultée le 12 novembre 2026.

- [Expo Notifications — déclencheur annuel](https://docs.expo.dev/versions/latest/sdk/notifications/#yearlytriggerinput)
- [Expo — versions de développement](https://docs.expo.dev/develop/development-builds/introduction/)
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [Android Developers — programmation des alarmes](https://developer.android.com/develop/background-work/services/alarms)
