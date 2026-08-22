import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const serviceAccountPath = resolve(process.cwd(), '..', 'artifacts', 'api-server', 'service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const DEVICE_ID = 'ESP32-WM001';
const METER_ID = 'WM-2024-COL-0042';

async function main() {
  console.log('Registering meter and device...\n');

  await db.collection('meters').doc(METER_ID).set({
    meterId: METER_ID,
    accountNumber: '',
    userId: null,
    deviceId: DEVICE_ID,
    status: 'active',
    type: 'residential',
    calibrationFactor: 450,
    region: 'Western',
    district: 'Colombo',
    lastSeen: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log(`Meter created: ${METER_ID}`);

  await db.collection('devices').doc(DEVICE_ID).set({
    deviceId: DEVICE_ID,
    meterId: METER_ID,
    userId: null,
    status: 'online',
    calibrationFactor: 450,
    region: 'Western',
    district: 'Colombo',
    totalReadings: 0,
    errorCount: 0,
    lastSeen: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log(`Device created: ${DEVICE_ID}`);

  console.log('\nDone! ESP32 can now connect.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
