# Logo mobile · BIRTHDAY-SAVE

Décompresser l’archive à la racine du projet pour obtenir le dossier `assets/birthday-save-brand/`. Les fichiers sont en PNG. Le monogramme reprend le calendrier, les lettres BS et le ruban de la maquette.

| Usage | Fichier | Taille |
| --- | --- | --- |
| Icône principale Expo et iOS | `expo/icon-1024.png` | 1024 × 1024, fond framboise opaque |
| Icône iOS sombre | `expo/ios-dark-1024.png` | 1024 × 1024, fond prune opaque |
| Icône iOS teintée par le système | `expo/ios-tinted-1024.png` | 1024 × 1024, niveaux de gris opaques |
| Android adaptatif | `expo/android-foreground-1024.png` | 1024 × 1024, premier plan transparent. Utiliser le fond `#AE1F4D` |
| Android avec thème système | `expo/android-monochrome-1024.png` | 1024 × 1024, masque blanc transparent |
| Splash screen | `expo/splash-1024.png` | 1024 × 1024, logo transparent pour fond framboise ou prune |
| Notification Android | `expo/notification-96.png` | 96 × 96, symbole blanc transparent |
| Fiche Google Play | `stores/google-play-512.png` | 512 × 512, PNG RGBA à fond framboise opaque |
| Lanceur Android natif classique | `android-legacy/mipmap-*/ic_launcher.png` | 48, 72, 96, 144 et 192 px selon la densité |
| Logo dans l’interface | `logo/bs-*-<taille>.png` | 64, 128, 256 et 1024 px, fond transparent |

Pour l’interface, utiliser `fond-clair` sur une surface claire et `fond-sombre` sur une surface sombre. Les versions `monochrome-blanc` et `monochrome-noir` sont disponibles en une seule couleur. Palette principale · framboise `#AE1F4D`, ivoire `#FFF2DB`, corail `#F18A87` et prune `#33192C`.

## Configuration Expo

Fusionner ces clés avec celles de l’`app.json` du projet. Avec un projet Expo standard, la compilation génère les tailles natives à partir des sources 1024 px. Le dossier `android-legacy/` est destiné à une intégration Android manuelle.

```json
{
  "expo": {
    "icon": "./assets/birthday-save-brand/expo/icon-1024.png",
    "ios": {
      "icon": {
        "light": "./assets/birthday-save-brand/expo/icon-1024.png",
        "dark": "./assets/birthday-save-brand/expo/ios-dark-1024.png",
        "tinted": "./assets/birthday-save-brand/expo/ios-tinted-1024.png"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/birthday-save-brand/expo/android-foreground-1024.png",
        "backgroundColor": "#AE1F4D",
        "monochromeImage": "./assets/birthday-save-brand/expo/android-monochrome-1024.png"
      }
    },
    "plugins": [
      [
        "expo-splash-screen",
        {
          "image": "./assets/birthday-save-brand/expo/splash-1024.png",
          "backgroundColor": "#AE1F4D",
          "dark": {
            "backgroundColor": "#33192C",
            "image": "./assets/birthday-save-brand/expo/splash-1024.png"
          },
          "imageWidth": 200,
          "resizeMode": "contain"
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/birthday-save-brand/expo/notification-96.png",
          "color": "#AE1F4D"
        }
      ]
    ]
  }
}
```

Les deux plugins doivent être présents dans le projet. Vérifier l’icône et le splash sur une compilation de l’application. Le splash natif utilise le monogramme seul. Le nom BIRTHDAY-SAVE sous le logo peut être affiché par l’écran de lancement React Native de la maquette.

## Références

- [Expo · Icônes et écran de démarrage](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/)
- [Expo · Configuration du splash screen](https://docs.expo.dev/versions/latest/sdk/splash-screen/)
- [Expo · Configuration de l’icône de notification](https://docs.expo.dev/versions/latest/sdk/notifications/#configurable-properties)
- [Android Developers · Icônes adaptatives](https://developer.android.com/develop/ui/compose/system/icon_design_adaptive)
- [Google Play · Spécifications de l’icône de la fiche](https://support.google.com/googleplay/android-developer/answer/9866151)
