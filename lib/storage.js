/**
 * Firebase Storage operations for scene assets.
 */

import { storage } from './firebase';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
} from 'firebase/storage';

/**
 * Upload a file to Firebase Storage for a specific scene and asset type.
 * @param {string} sceneId
 * @param {'glb'|'sog'|'skybox'|'floor'} assetType
 * @param {File} file
 * @param {Function} onProgress - Callback with progress percentage (0-100)
 * @returns {Promise<{url: string, fileName: string, size: number}>}
 */
export async function uploadAsset(sceneId, assetType, file, onProgress) {
  // Build storage path: scenes/{sceneId}/{assetType}/{fileName}
  const storagePath = `scenes/${sceneId}/${assetType}/${file.name}`;
  const storageRef = ref(storage, storagePath);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        onProgress?.(progress);
      },
      (error) => {
        console.error(`Upload error [${assetType}]:`, error);
        reject(error);
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            url,
            fileName: file.name,
            size: file.size,
          });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

/**
 * Delete an asset from Firebase Storage.
 * @param {string} sceneId
 * @param {'glb'|'sog'|'skybox'|'floor'} assetType
 * @param {string} fileName - The file name to delete
 */
export async function deleteAsset(sceneId, assetType, fileName) {
  const storagePath = `scenes/${sceneId}/${assetType}/${fileName}`;
  const storageRef = ref(storage, storagePath);

  try {
    await deleteObject(storageRef);
  } catch (err) {
    // File may not exist, ignore
    if (err.code !== 'storage/object-not-found') {
      throw err;
    }
  }
}

/**
 * Delete all assets for a scene from Firebase Storage.
 */
export async function deleteSceneAssets(sceneId) {
  const folderRef = ref(storage, `scenes/${sceneId}`);

  try {
    const result = await listAll(folderRef);

    // Delete files in root
    for (const item of result.items) {
      await deleteObject(item);
    }

    // Delete files in subdirectories
    for (const prefix of result.prefixes) {
      const subResult = await listAll(prefix);
      for (const item of subResult.items) {
        await deleteObject(item);
      }
    }
  } catch (err) {
    console.warn('Failed to delete scene assets from storage:', err);
  }
}
