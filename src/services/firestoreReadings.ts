import {
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    getDocs,
} from 'firebase/firestore';

import { db } from '../../firebase';

import { EnergyReading } from '../types';

export async function saveReading(
    userId: string,
    reading: EnergyReading
) {
    await addDoc(
        collection(
            db,
            'usuarios',
            userId,
            'leituras'
        ),
        reading
    );
}

export async function getLatestReadings(
    userId: string,
    amount: number = 50
): Promise<EnergyReading[]> {

    const q = query(
        collection(
            db,
            'usuarios',
            userId,
            'leituras'
        ),
        orderBy('timestamp', 'desc'),
        limit(amount)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as EnergyReading[];
}