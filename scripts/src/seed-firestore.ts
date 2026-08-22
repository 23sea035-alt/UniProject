import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCyifI2F6K0aCOSkfKpwPMyA6NLjvz2pkw',
  authDomain: 'simple-4b447.firebaseapp.com',
  projectId: 'simple-4b447',
  storageBucket: 'simple-4b447.firebasestorage.app',
  messagingSenderId: '767295346015',
  appId: '1:767295346015:web:a8a858edaf89a8feddd2ea',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const PASSWORD = 'AquaTrack123!';

const USERS = [
  {
    firstName: 'Kasun',
    lastName: 'Perera',
    email: 'kasun@aquatrack.lk',
    nic: '199512345678',
    phone: '0771234567',
    address: '42/A, Galle Road, Colombo 3',
    meterId: 'WM-2024-COL-0042',
    role: 'user',
    district: 'Colombo',
    sensorData: {
      flowRate: 12.4,
      pressure1: 2.35,
      pressure2: 2.18,
      battery: 85,
      hydroVoltage: 5.2,
      hydroStatus: 'Active',
      valveStatus: 'Open',
      online: true,
      todayUsage: 0.82,
      lastSync: new Date(),
      wifiSignal: -62,
    },
    currentUnits: 14.5,
  },
  {
    firstName: 'Malini',
    lastName: 'Fernando',
    email: 'malini@aquatrack.lk',
    nic: '198034567890',
    phone: '0761234567',
    address: '15, Lighthouse Street, Galle Fort',
    meterId: 'WM-2024-GAL-0017',
    role: 'user',
    district: 'Galle',
    sensorData: {
      flowRate: 8.1,
      pressure1: 2.55,
      pressure2: 2.42,
      battery: 72,
      hydroVoltage: 5.0,
      hydroStatus: 'Active',
      valveStatus: 'Open',
      online: true,
      todayUsage: 0.55,
      lastSync: new Date(),
      wifiSignal: -71,
    },
    currentUnits: 6.2,
  },
  {
    firstName: 'Ruwan',
    lastName: 'Jayawardena',
    email: 'ruwan@aquatrack.lk',
    nic: '197823456789',
    phone: '0751234567',
    address: '8, Peradeniya Road, Kandy',
    meterId: 'WM-2024-KAN-0033',
    role: 'user',
    district: 'Kandy',
    sensorData: {
      flowRate: 0,
      pressure1: 0,
      pressure2: 0,
      battery: 23,
      hydroVoltage: 3.8,
      hydroStatus: 'Inactive',
      valveStatus: 'Closed',
      online: false,
      todayUsage: 0,
      lastSync: new Date(Date.now() - 86400000),
      wifiSignal: 0,
    },
    currentUnits: 32.1,
  },
  {
    firstName: 'Priyanka',
    lastName: 'Dissanayake',
    email: 'priyanka@aquatrack.lk',
    nic: '199645678901',
    phone: '0712345678',
    address: '23, Beach Road, Negombo',
    meterId: 'WM-2024-NEG-0008',
    role: 'user',
    district: 'Negombo',
    sensorData: {
      flowRate: 10.8,
      pressure1: 2.65,
      pressure2: 2.51,
      battery: 91,
      hydroVoltage: 5.4,
      hydroStatus: 'Active',
      valveStatus: 'Open',
      online: true,
      todayUsage: 0.73,
      lastSync: new Date(),
      wifiSignal: -55,
    },
    currentUnits: 18.3,
  },
  {
    firstName: 'Tharaka',
    lastName: 'Bandara',
    email: 'tharaka@aquatrack.lk',
    nic: '200012345678',
    phone: '0701234567',
    address: '5, Temple Road, Matara',
    meterId: 'WM-2024-MAT-0025',
    role: 'user',
    district: 'Matara',
    sensorData: {
      flowRate: 6.3,
      pressure1: 2.45,
      pressure2: 2.38,
      battery: 67,
      hydroVoltage: 5.1,
      hydroStatus: 'Active',
      valveStatus: 'Open',
      online: true,
      todayUsage: 0.42,
      lastSync: new Date(),
      wifiSignal: -68,
    },
    currentUnits: 8.7,
  },
  {
    firstName: 'Nimal',
    lastName: 'Silva',
    email: 'admin@nwsdb.lk',
    nic: '198045678901',
    phone: '0112345678',
    address: 'NWSDB Head Office, Torrington Square, Colombo 2',
    meterId: 'GOV-ADM-001',
    role: 'government',
    district: '',
    sensorData: {},
    currentUnits: 0,
  },
];

async function main() {
  console.log('Seeding Firestore...\n');

  for (const u of USERS) {
    try {
      let uid: string;

      try {
        const cred = await createUserWithEmailAndPassword(auth, u.email, PASSWORD);
        uid = cred.user.uid;
        console.log(`Created auth user: ${u.email} (${uid})`);
      } catch (err: any) {
        if (err.code === 'auth/email-already-in-use') {
          const cred = await signInWithEmailAndPassword(auth, u.email, PASSWORD);
          uid = cred.user.uid;
          console.log(`User exists, signed in: ${u.email} (${uid})`);
        } else {
          console.error(`Failed to create ${u.email}:`, err.message);
          continue;
        }
      }

      const profile = {
        uid,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        nic: u.nic,
        phone: u.phone,
        address: u.address,
        meterId: u.meterId,
        role: u.role,
        district: u.district,
        currentUnits: u.currentUnits,
        sensorData: u.sensorData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', uid), profile);
      console.log(`  → Wrote profile to users/${uid}`);

      if (u.role === 'user') {
        const dailyEntries = Array.from({ length: new Date().getDate() }, (_, i) => ({
          day: i + 1,
          usage: parseFloat((0.3 + Math.random() * 0.9).toFixed(2)),
        }));

        for (const entry of dailyEntries) {
          await setDoc(doc(db, 'users', uid, 'usage', 'daily', 'entries', `day-${entry.day}`), entry);
        }
        console.log(`  → Wrote ${dailyEntries.length} daily usage entries`);

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();
        for (let i = 0; i <= currentMonth; i++) {
          await setDoc(doc(db, 'users', uid, 'usage', 'monthly', 'entries', months[i]), {
            month: months[i],
            usage: i < currentMonth
              ? parseFloat((8 + Math.random() * 12).toFixed(1))
              : parseFloat((u.currentUnits).toFixed(1)),
          });
        }
        console.log(`  → Wrote ${currentMonth + 1} monthly usage entries`);
      }

      console.log('');
    } catch (err: any) {
      console.error(`Error processing ${u.email}:`, err.message);
    }
  }

  console.log('Seeding complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
