const API_KEY = 'AIzaSyCyifI2F6K0aCOSkfKpwPMyA6NLjvz2pkw';
const PROJECT_ID = 'simple-4b447';
const BASE = `https://identitytoolkit.googleapis.com/v1`;
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const PASSWORD = 'AquaTrack123!';

async function signUp(email, password) {
  const url = `${BASE}/accounts:signUp?key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error(`Non-JSON response (${res.status}): ${text.substring(0, 200)}`); }
  if (data.error) throw new Error(data.error.message);
  return { uid: data.localId, idToken: data.idToken };
}

async function signIn(email, password) {
  const res = await fetch(`${BASE}/accounts:signInWithPassword?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error(`Non-JSON response (${res.status}): ${text.substring(0, 200)}`); }
  if (data.error) throw new Error(data.error.message);
  return { uid: data.localId, idToken: data.idToken };
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function writeDoc(path, fields, idToken) {
  const f = {};
  for (const [k, v] of Object.entries(fields)) {
    if (typeof v === 'string') f[k] = { stringValue: v };
    else if (typeof v === 'number') f[k] = { doubleValue: v };
    else if (typeof v === 'boolean') f[k] = { booleanValue: v };
    else if (v && v.__ts) f[k] = { timestampValue: v.__ts };
    else if (v && v.__null) f[k] = { nullValue: null };
    else if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      const mapFields = {};
      for (const [mk, mv] of Object.entries(v)) {
        if (typeof mv === 'string') mapFields[mk] = { stringValue: mv };
        else if (typeof mv === 'number') mapFields[mk] = { doubleValue: mv };
        else if (typeof mv === 'boolean') mapFields[mk] = { booleanValue: mv };
      }
      f[k] = { mapValue: { fields: mapFields } };
    }
  }
  const res = await fetch(`${FS}/${path}?updateMask.fieldPaths=${Object.keys(fields).join('&updateMask.fieldPaths=')}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({ fields: f }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

function ts(date = new Date()) {
  return { __ts: date.toISOString() };
}

const USERS = [
  {
    firstName: 'Kasun', lastName: 'Perera', email: 'kasun@aquatrack.lk',
    nic: '199512345678', phone: '0771234567', address: '42/A, Galle Road, Colombo 3',
    meterId: 'WM-2024-COL-0042', role: 'user', district: 'Colombo', currentUnits: 14.5,
    sensorData: { flowRate: 12.4, pressure1: 2.35, pressure2: 2.18, battery: 85, hydroVoltage: 5.2, hydroStatus: 'Active', valveStatus: 'Open', online: true, todayUsage: 0.82, wifiSignal: -62 },
  },
  {
    firstName: 'Malini', lastName: 'Fernando', email: 'malini@aquatrack.lk',
    nic: '198034567890', phone: '0761234567', address: '15, Lighthouse Street, Galle Fort',
    meterId: 'WM-2024-GAL-0017', role: 'user', district: 'Galle', currentUnits: 6.2,
    sensorData: { flowRate: 8.1, pressure1: 2.55, pressure2: 2.42, battery: 72, hydroVoltage: 5.0, hydroStatus: 'Active', valveStatus: 'Open', online: true, todayUsage: 0.55, wifiSignal: -71 },
  },
  {
    firstName: 'Ruwan', lastName: 'Jayawardena', email: 'ruwan@aquatrack.lk',
    nic: '197823456789', phone: '0751234567', address: '8, Peradeniya Road, Kandy',
    meterId: 'WM-2024-KAN-0033', role: 'user', district: 'Kandy', currentUnits: 32.1,
    sensorData: { flowRate: 0, pressure1: 0, pressure2: 0, battery: 23, hydroVoltage: 3.8, hydroStatus: 'Inactive', valveStatus: 'Closed', online: false, todayUsage: 0, wifiSignal: 0 },
  },
  {
    firstName: 'Priyanka', lastName: 'Dissanayake', email: 'priyanka@aquatrack.lk',
    nic: '199645678901', phone: '0712345678', address: '23, Beach Road, Negombo',
    meterId: 'WM-2024-NEG-0008', role: 'user', district: 'Negombo', currentUnits: 18.3,
    sensorData: { flowRate: 10.8, pressure1: 2.65, pressure2: 2.51, battery: 91, hydroVoltage: 5.4, hydroStatus: 'Active', valveStatus: 'Open', online: true, todayUsage: 0.73, wifiSignal: -55 },
  },
  {
    firstName: 'Tharaka', lastName: 'Bandara', email: 'tharaka@aquatrack.lk',
    nic: '200012345678', phone: '0701234567', address: '5, Temple Road, Matara',
    meterId: 'WM-2024-MAT-0025', role: 'user', district: 'Matara', currentUnits: 8.7,
    sensorData: { flowRate: 6.3, pressure1: 2.45, pressure2: 2.38, battery: 67, hydroVoltage: 5.1, hydroStatus: 'Active', valveStatus: 'Open', online: true, todayUsage: 0.42, wifiSignal: -68 },
  },
  {
    firstName: 'Nimal', lastName: 'Silva', email: 'admin@nwsdb.lk',
    nic: '198045678901', phone: '0112345678', address: 'NWSDB Head Office, Torrington Square, Colombo 2',
    meterId: 'GOV-ADM-001', role: 'government', district: '', currentUnits: 0,
    sensorData: {},
  },
];

async function main() {
  console.log('=== AquaTrack Firestore Seeder ===\n');

  for (const u of USERS) {
    try {
      let uid, idToken;

      try {
        const r = await signUp(u.email, PASSWORD);
        uid = r.uid;
        idToken = r.idToken;
        console.log(`Created user: ${u.email} (${uid})`);
      } catch (e) {
        if (e.message.includes('EMAIL_EXISTS')) {
          const r = await signIn(u.email, PASSWORD);
          uid = r.uid;
          idToken = r.idToken;
          console.log(`User exists, signed in: ${u.email} (${uid})`);
        } else {
          console.error(`Failed ${u.email}: ${e.message}`);
          continue;
        }
      }
      await sleep(500);

      const profile = {
        uid, firstName: u.firstName, lastName: u.lastName, email: u.email,
        nic: u.nic, phone: u.phone, address: u.address, meterId: u.meterId,
        role: u.role, district: u.district, currentUnits: u.currentUnits,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };

      if (Object.keys(u.sensorData).length > 0) {
        profile.sensorData = {
          flowRate: u.sensorData.flowRate,
          pressure1: u.sensorData.pressure1,
          pressure2: u.sensorData.pressure2,
          battery: u.sensorData.battery,
          hydroVoltage: u.sensorData.hydroVoltage,
          hydroStatus: u.sensorData.hydroStatus,
          valveStatus: u.sensorData.valveStatus,
          online: u.sensorData.online,
          todayUsage: u.sensorData.todayUsage,
          wifiSignal: u.sensorData.wifiSignal,
        };
      }

      await writeDoc(`users/${uid}`, profile, idToken);
      console.log(`  -> Wrote profile`);

      if (u.role === 'user') {
        const today = new Date().getDate();
        for (let i = 1; i <= today; i++) {
          const usage = parseFloat((0.3 + Math.random() * 0.9).toFixed(2));
          await writeDoc(`users/${uid}/usage/daily/entries/day-${i}`, { day: i, usage }, idToken);
          await sleep(200);
        }
        console.log(`  -> Wrote ${today} daily entries`);

        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const curMonth = new Date().getMonth();
        for (let i = 0; i <= curMonth; i++) {
          const usage = i < curMonth
            ? parseFloat((8 + Math.random() * 12).toFixed(1))
            : u.currentUnits;
          await writeDoc(`users/${uid}/usage/monthly/entries/${months[i]}`, { month: months[i], usage }, idToken);
          await sleep(200);
        }
        console.log(`  -> Wrote ${curMonth + 1} monthly entries`);
      }

      console.log('');
      await sleep(1000);
    } catch (e) {
      console.error(`Error ${u.email}: ${e.message}`);
    }
  }

  console.log('Seeding complete!');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
