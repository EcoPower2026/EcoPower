import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Alert, Goal, EnergyReading, Appliance } from '../types';
function alertasRef(userId: string) {
  return collection(db, 'usuarios', userId, 'alertas');
}

function alertaRef(userId: string, alertaId: string) {
  return doc(db, 'usuarios', userId, 'alertas', alertaId);
}

export async function createAlert(
  userId: string,
  data: {
    tipo: string;
    titulo: string;
    mensagem: string;
    nivel: 'info' | 'warning' | 'danger';
  }
): Promise<string> {
  const ref = await addDoc(alertasRef(userId), {
    ...data,
    lido: false,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function markAsRead(
  userId: string,
  alertaId: string
): Promise<void> {
  await updateDoc(alertaRef(userId, alertaId), { lido: true });
}

export async function markAllAlertsAsRead(userId: string): Promise<void> {
  const q = query(alertasRef(userId), where('lido', '==', false));
  const snapshot = await getDocs(q);
  const updates = snapshot.docs.map(d => updateDoc(d.ref, { lido: true }));
  await Promise.all(updates);
}

export async function deleteAlert(
  userId: string,
  alertaId: string
): Promise<void> {
  await deleteDoc(alertaRef(userId, alertaId));
}

export function subscribeAlerts(
  userId: string,
  callback: (alerts: Alert[]) => void
): Unsubscribe {
  const q = query(alertasRef(userId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snapshot => {
    const list = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
    })) as Alert[];
    callback(list);
  });
}

function getMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

async function getMonthlyReadings(
  userId: string
): Promise<EnergyReading[]> {
  const { start, end } = getMonthRange();
  const readingsRef = collection(db, 'usuarios', userId, 'leituras');
  const q = query(
    readingsRef,
    where('timestamp', '>=', start),
    where('timestamp', '<=', end),
    orderBy('timestamp', 'desc')
  );
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as EnergyReading[];
  } catch {
    return [];
  }
}

async function getLegacyReadings(
  userId: string
): Promise<EnergyReading[]> {
  const { start, end } = getMonthRange();
  const readingsRef = collection(db, 'users', userId, 'readings');
  const q = query(
    readingsRef,
    where('timestamp', '>=', start),
    where('timestamp', '<=', end),
    orderBy('timestamp', 'desc')
  );
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as EnergyReading[];
  } catch {
    return [];
  }
}

function aggregateReadings(readings: EnergyReading[]): {
  totalKwh: number;
  totalCost: number;
  applianceMap: Map<string, { kwh: number; cost: number }>;
} {
  const applianceMap = new Map<string, { kwh: number; cost: number }>();
  let totalKwh = 0;
  let totalCost = 0;

  for (const r of readings) {
    totalKwh += r.kwh || 0;
    totalCost += r.cost || 0;
    const key = r.applianceId || r.applianceName;
    if (key) {
      const existing = applianceMap.get(key) || { kwh: 0, cost: 0 };
      existing.kwh += r.kwh || 0;
      existing.cost += r.cost || 0;
      applianceMap.set(key, existing);
    }
  }

  return { totalKwh, totalCost, applianceMap };
}

export async function generateAutomaticAlerts(
  userId: string,
  goals: Goal[],
  appliances: Appliance[],
  userTarifa?: number
): Promise<void> {
  const readings = await getMonthlyReadings(userId);
  const legacyReadings = await getLegacyReadings(userId);
  const allReadings = [...readings, ...legacyReadings];
  const { totalKwh, totalCost, applianceMap } = aggregateReadings(allReadings);

  for (const goal of goals) {
    if (!goal.ativa) continue;

    if (goal.progresso >= goal.valorAlvo && goal.valorAlvo > 0) {
      await createAlert(userId, {
        tipo: 'meta_atingida',
        titulo: 'Meta Atingida!',
        mensagem: `Parabéns! Você atingiu a meta "${goal.titulo}" com ${goal.progresso.toFixed(0)}% de progresso.`,
        nivel: 'info',
      });
    } else if (goal.progresso >= goal.valorAlvo * 0.9 && goal.valorAlvo > 0) {
      await createAlert(userId, {
        tipo: 'meta_proxima',
        titulo: 'Meta quase atingida',
        mensagem: `A meta "${goal.titulo}" está em ${goal.progresso.toFixed(0)}% de progresso. Continue assim!`,
        nivel: 'warning',
      });
    }

    const consumptionCost = totalCost || (totalKwh * (userTarifa || 0.95));
    if (consumptionCost > 0 && consumptionCost > goal.valorAlvo) {
      await createAlert(userId, {
        tipo: 'consumo_acima_meta',
        titulo: 'Consumo acima da meta',
        mensagem: `Seu consumo atual de R$ ${consumptionCost.toFixed(2)} ultrapassou a meta de R$ ${goal.valorAlvo.toFixed(2)} estabelecida.`,
        nivel: 'danger',
      });
    }
  }

  const monthlyCost = totalCost || (totalKwh * (userTarifa || 0.95));
  if (monthlyCost > 300) {
    await createAlert(userId, {
      tipo: 'consumo_alto',
      titulo: 'Consumo mensal elevado',
      mensagem: `Seu consumo mensal estimado é de R$ ${monthlyCost.toFixed(2)}, acima do limite de R$ 300,00.`,
      nivel: 'danger',
    });
  }

  if (applianceMap.size > 0) {
    let maxKwh = 0;
    let maxName = '';
    for (const [name, data] of applianceMap) {
      if (data.kwh > maxKwh) {
        maxKwh = data.kwh;
        maxName = name;
      }
    }
    if (maxName && totalKwh > 0) {
      const percentage = (maxKwh / totalKwh) * 100;
      if (percentage > 50) {
        const appliance = appliances.find(a => a.id === maxName || a.nome === maxName);
        const displayName = appliance?.nome || maxName;
        await createAlert(userId, {
          tipo: 'aparelho_dominante',
          titulo: 'Aparelho de alto consumo',
          mensagem: `"${displayName}" é responsável por ${percentage.toFixed(0)}% do seu consumo total.`,
          nivel: 'warning',
        });
      }
    }
  }
}
