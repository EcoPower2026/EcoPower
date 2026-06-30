import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { PlanType, PLANS, PlanDefinition } from '../services/subscriptionService';

interface SubscriptionContextType {
  plan: PlanType;
  setPlan: (plan: PlanType) => void;
  planData: PlanDefinition;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children, initialPlan = 'eco_free' as PlanType }: { children: ReactNode; initialPlan?: PlanType }) {
  const [plan, setPlan] = useState<PlanType>(initialPlan);
  const planData = PLANS[plan];
  const value = useMemo(() => ({ plan, setPlan, planData }), [plan, planData]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextType {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
