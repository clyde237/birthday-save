import * as FileSystem from 'expo-file-system/legacy';

const PROFILE_IMAGE_DIRECTORY = `${FileSystem.documentDirectory}profile-images/`;

export async function persistProfileImage(sourceUri: string, profileId: string): Promise<string> {
  if (!FileSystem.documentDirectory) {
    throw new Error('Le stockage local des photos est indisponible.');
  }

  if (sourceUri.startsWith(PROFILE_IMAGE_DIRECTORY)) return sourceUri;

  await FileSystem.makeDirectoryAsync(PROFILE_IMAGE_DIRECTORY, { intermediates: true });

  const sourceExtension = sourceUri.match(/\.([a-zA-Z0-9]+)(?:[?#].*)?$/)?.[1]?.toLowerCase();
  const extension = sourceExtension && ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(sourceExtension)
    ? sourceExtension
    : 'jpg';
  const destinationUri = `${PROFILE_IMAGE_DIRECTORY}${encodeURIComponent(profileId)}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

  await FileSystem.copyAsync({ from: sourceUri, to: destinationUri });
  return destinationUri;
}

export async function deleteProfileImage(uri?: string): Promise<void> {
  if (!uri || !FileSystem.documentDirectory || !uri.startsWith(PROFILE_IMAGE_DIRECTORY)) return;
  await FileSystem.deleteAsync(uri, { idempotent: true });
}
