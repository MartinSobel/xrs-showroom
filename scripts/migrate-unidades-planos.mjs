#!/usr/bin/env node

/**
 * Migration script: Re-upload existing unidades imagen_plano URLs to Firebase Storage.
 *
 * For each scene with unidades items that have a non-empty `imagen_plano` string,
 * this script will:
 *   1. Download the image from the current URL
 *   2. Upload it to Firebase Storage under `scenes/{sceneId}/unidades/`
 *   3. Update the RTDB entry with the new Firebase Storage download URL
 *
 * Usage:
 *   node scripts/migrate-unidades-planos.mjs
 *
 * Requires: FIREBASE env vars in .env.local (loaded via dotenv).
 */

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ─── Load .env.local ───────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eqIndex = trimmed.indexOf('=');
  if (eqIndex === -1) return;
  env[trimmed.slice(0, eqIndex)] = trimmed.slice(eqIndex + 1);
});

// ─── Firebase Init ─────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL:       env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId:         env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);
const storage = getStorage(app);

// ─── Helpers ───────────────────────────────────────────────────

/** Download a file from a URL and return it as a Uint8Array + content type */
async function downloadImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  const buffer = await res.arrayBuffer();
  return { data: new Uint8Array(buffer), contentType };
}

/** Get a file extension from a content type */
function extFromContentType(ct) {
  if (ct.includes('png'))  return '.png';
  if (ct.includes('webp')) return '.webp';
  if (ct.includes('gif'))  return '.gif';
  if (ct.includes('svg'))  return '.svg';
  if (ct.includes('pdf'))  return '.pdf';
  return '.jpg';
}

/** Check if a URL is already a Firebase Storage URL for our bucket */
function isAlreadyFirebaseStorage(url) {
  return url.includes('firebasestorage.googleapis.com') ||
         url.includes('firebasestorage.app');
}

// ─── Main ──────────────────────────────────────────────────────
async function main() {
  console.log('🔍 Fetching all scenes from RTDB...');
  const scenesSnap = await get(ref(db, 'scenes'));

  if (!scenesSnap.exists()) {
    console.log('⚠️  No scenes found. Nothing to migrate.');
    process.exit(0);
  }

  const scenes = scenesSnap.val();
  let totalMigrated = 0;
  let totalSkipped  = 0;
  let totalErrors   = 0;

  for (const [sceneId, scene] of Object.entries(scenes)) {
    const items = scene?.unidades?.items;
    if (!items || !Array.isArray(items)) continue;

    let sceneUpdated = false;

    for (let i = 0; i < items.length; i++) {
      const unit = items[i];
      const url  = unit?.imagen_plano;

      if (!url || typeof url !== 'string' || url.trim() === '') {
        continue; // No image — skip
      }

      if (isAlreadyFirebaseStorage(url)) {
        console.log(`  ⏭  Scene "${scene.name}" / Unit "${unit.id}" — already Firebase Storage, skipping.`);
        totalSkipped++;
        continue;
      }

      console.log(`  ⬇️  Downloading: ${url.slice(0, 80)}...`);
      try {
        const { data, contentType } = await downloadImage(url);
        const ext = extFromContentType(contentType);
        const storagePath = `scenes/${sceneId}/unidades/${unit.id || i}_plano_${Date.now()}${ext}`;
        const fileRef = storageRef(storage, storagePath);

        console.log(`  ⬆️  Uploading to: ${storagePath} (${(data.length / 1024).toFixed(1)} KB)`);
        await uploadBytes(fileRef, data, { contentType });
        const newUrl = await getDownloadURL(fileRef);

        // Update the item in-memory
        items[i] = { ...unit, imagen_plano: newUrl };
        sceneUpdated = true;
        totalMigrated++;
        console.log(`  ✅ Migrated: Unit "${unit.id}" → Firebase Storage`);
      } catch (err) {
        console.error(`  ❌ Error migrating unit "${unit.id}" in scene "${scene.name}":`, err.message);
        totalErrors++;
      }
    }

    if (sceneUpdated) {
      // Write updated items back to RTDB
      console.log(`  💾 Saving updated items for scene "${scene.name}"...`);
      await set(ref(db, `scenes/${sceneId}/unidades/items`), items);
      console.log(`  ✅ Scene "${scene.name}" saved.\n`);
    }
  }

  console.log('\n═══════════════════════════════════════');
  console.log(`✅ Migrated: ${totalMigrated}`);
  console.log(`⏭  Skipped:  ${totalSkipped}`);
  console.log(`❌ Errors:   ${totalErrors}`);
  console.log('═══════════════════════════════════════\n');

  process.exit(totalErrors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
