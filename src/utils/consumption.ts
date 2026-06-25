type ApplianceConfig = {
  name: string;
  power: number;
  hoursPerDay: number;
  costPerKwh: number;
};

export const calculateKwh = (power: number, hours: number): number => {
    return Number(((power * hours) / 1000).toFixed(2));
};

export const calculateCost = (kwh: number, costPerKwh: number): number => {
    return Number((kwh * costPerKwh).toFixed(2));
};

export const calculateApplianceConsumption = (appliance: ApplianceConfig) => {
    const kwh = calculateKwh(appliance.power, appliance.hoursPerDay);
    return {
        ...appliance,
        kwh,
        cost: calculateCost(kwh, appliance.costPerKwh),
    };
};

export const sumAppliances = (appliances: ApplianceConfig[]) => {
    return appliances.reduce(
        (acc, item) => {
            const kwh = calculateKwh(item.power, item.hoursPerDay);
            const cost = calculateCost(kwh, item.costPerKwh);
            return {
                dailyKwh: acc.dailyKwh + kwh,
                dailyCost: acc.dailyCost + cost,
            };
        },
        { dailyKwh: 0, dailyCost: 0 },
    );
};
