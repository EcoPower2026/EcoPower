import { EnergyReading } from '../types';

export function calculatePower(
    current: number,
    voltage: number
): number {
    return Number((current * voltage).toFixed(2));
}

export function calculateKwh(
    power: number,
    secondsElapsed: number
): number {
    const hours = secondsElapsed / 3600;

    return Number(((power * hours) / 1000).toFixed(6));
}

export function calculateCost(
    kwh: number,
    tariff: number
): number {
    return Number((kwh * tariff).toFixed(4));
}

export function createReading(
    applianceId: string,
    applianceName: string,
    current: number,
    voltage: number,
    tariff: number,
    secondsElapsed: number
): EnergyReading {

    const power = calculatePower(current, voltage);

    const kwh = calculateKwh(
        power,
        secondsElapsed
    );

    const cost = calculateCost(
        kwh,
        tariff
    );

    return {
        applianceId,
        applianceName,

        current,
        voltage,

        power,

        kwh,

        cost,

        timestamp: new Date().toISOString(),
    };
}