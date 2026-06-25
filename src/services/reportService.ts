import {
  collection,
  doc,
  getDoc,
  query,
  orderBy,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { ApplianceStat, Report, ReportType } from '../types';

function getPeriodRange(type: ReportType): { start: string; end: string } {
  const now = new Date();
  let start: Date;

  switch (type) {
    case 'daily':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'weekly':
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      start = new Date(now.getFullYear(), now.getMonth(), diff);
      break;
    case 'monthly':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return {
    start: start.toISOString(),
    end: now.toISOString(),
  };
}

async function getReadingsInRange(
  userId: string,
  start: string,
  end: string
): Promise<any[]> {
  const results: any[] = [];

  const usuariosRef = collection(db, 'usuarios', userId, 'leituras');
  try {
    const q1 = query(
      usuariosRef,
      where('timestamp', '>=', start),
      where('timestamp', '<=', end),
      orderBy('timestamp', 'desc')
    );
    const snap1 = await getDocs(q1);
    results.push(...snap1.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch {
    // collection may not exist yet
  }

  const usersRef = collection(db, 'users', userId, 'readings');
  try {
    const q2 = query(
      usersRef,
      where('timestamp', '>=', start),
      where('timestamp', '<=', end),
      orderBy('timestamp', 'desc')
    );
    const snap2 = await getDocs(q2);
    results.push(...snap2.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch {
    // collection may not exist yet
  }

  return results;
}

async function getAppliances(userId: string): Promise<any[]> {
  try {
    const ref = collection(db, 'usuarios', userId, 'aparelhos');
    const snap = await getDocs(ref);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch {
    return [];
  }
}

async function getUserProfile(userId: string): Promise<any | null> {
  try {
    const ref = doc(db, 'usuarios', userId);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  } catch {
    return null;
  }
}

export async function generateReport(
  userId: string,
  type: ReportType,
  applianceFilter?: string
): Promise<Report> {
  const { start, end } = getPeriodRange(type);
  const readings = await getReadingsInRange(userId, start, end);
  const userProfile = await getUserProfile(userId);
  const userName = userProfile?.nome ?? '';
  const tariff = userProfile?.tarifaKwh ?? 0.95;

  let filteredReadings = readings;
  if (applianceFilter) {
    filteredReadings = readings.filter(
      (r: any) =>
        r.applianceId === applianceFilter || r.applianceName === applianceFilter
    );
  }

  const totalConsumption = filteredReadings.reduce(
    (acc: number, r: any) => acc + (r.kwh || 0),
    0
  );
  const totalCost = filteredReadings.reduce(
    (acc: number, r: any) => acc + (r.cost || r.kwh * tariff || 0),
    0
  );

  const applianceMap = new Map<string, { consumption: number; cost: number }>();
  for (const r of filteredReadings) {
    const key = r.applianceName || r.applianceId || 'Desconhecido';
    const existing = applianceMap.get(key) || { consumption: 0, cost: 0 };
    existing.consumption += r.kwh || 0;
    existing.cost += r.cost || r.kwh * tariff || 0;
    applianceMap.set(key, existing);
  }

  const dailyAverage = totalConsumption > 0 ? totalConsumption / 30 : 0;

  const applianceStats: ApplianceStat[] = [];
  let topConsumer: { name: string; consumption: number; percentage: number } | null = null;
  let bottomConsumer: { name: string; consumption: number; percentage: number } | null = null;

  if (applianceMap.size > 0) {
    let maxConsumption = -1;
    let minConsumption = Infinity;
    let maxName = '';
    let minName = '';

    for (const [name, data] of applianceMap) {
      const percentage = totalConsumption > 0 ? (data.consumption / totalConsumption) * 100 : 0;
      applianceStats.push({ name, consumption: data.consumption, cost: data.cost, percentage });

      if (data.consumption > maxConsumption) {
        maxConsumption = data.consumption;
        maxName = name;
      }
      if (data.consumption < minConsumption) {
        minConsumption = data.consumption;
        minName = name;
      }
    }

    if (maxName) {
      const pct = totalConsumption > 0 ? (maxConsumption / totalConsumption) * 100 : 0;
      topConsumer = { name: maxName, consumption: maxConsumption, percentage: pct };
    }
    if (minName) {
      const pct = totalConsumption > 0 ? (minConsumption / totalConsumption) * 100 : 0;
      bottomConsumer = { name: minName, consumption: minConsumption, percentage: pct };
    }
  }

  return {
    type,
    period: { start, end },
    totalConsumption,
    totalCost,
    topConsumer,
    bottomConsumer,
    dailyAverage,
    applianceStats,
    generatedAt: new Date().toISOString(),
    userName,
  };
}

export async function generateConsolidatedReport(
  userId: string
): Promise<Report[]> {
  const types: ReportType[] = ['daily', 'weekly', 'monthly'];
  const results = await Promise.all(
    types.map(t => generateReport(userId, t))
  );
  return results;
}

export async function generateApplianceReport(
  userId: string,
  applianceId: string
): Promise<Report> {
  return generateReport(userId, 'monthly', applianceId);
}

export async function generateCompleteReport(
  userId: string
): Promise<Report> {
  const monthly = await generateReport(userId, 'monthly');
  const appliances = await getAppliances(userId);
  const allStats: ApplianceStat[] = [];

  for (const app of appliances) {
    const appReport = await generateReport(userId, 'monthly', app.id);
    if (appReport.totalConsumption > 0) {
      allStats.push(...appReport.applianceStats);
    }
  }

  if (allStats.length > 0) {
    monthly.applianceStats = allStats;
  }

  return monthly;
}
