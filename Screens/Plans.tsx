import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../src/contexts/ThemeContext';
import { spacing, borderRadius, shadows } from '../src/theme/designSystem';

interface PlanPricing {
  monthly: string;
  annual: string;
  annualTotal: string;
  annualSavings: string;
}

interface PlanDetail {
  name: string;
  pricing: PlanPricing;
  color: string;
  tagline: string;
  features: string[];
  recommended?: boolean;
}

const consumerPlans: PlanDetail[] = [
  {
    name: 'Eco Free',
    pricing: {
      monthly: 'Grátis',
      annual: 'Grátis',
      annualTotal: 'Grátis',
      annualSavings: '',
    },
    color: '#64748B',
    tagline: 'Para começar',
    features: [
      '5 aparelhos cadastrados',
      '1 meta de economia ativa',
      'Histórico de 30 dias',
      'Alertas inteligentes',
    ],
  },
  {
    name: 'Eco Plus',
    pricing: {
      monthly: 'R$ 9,90',
      annual: 'R$ 8,25',
      annualTotal: 'R$ 99',
      annualSavings: 'Economia de R$ 19,80',
    },
    color: '#0EA5E9',
    tagline: 'Para expandir',
    recommended: true,
    features: [
      'Aparelhos ilimitados',
      'Metas ilimitadas',
      'Histórico completo',
      'Gráficos comparativos avançados',
    ],
  },
  {
    name: 'Eco Premium',
    pricing: {
      monthly: 'R$ 24,90',
      annual: 'R$ 20,75',
      annualTotal: 'R$ 249',
      annualSavings: 'Economia de R$ 49,80',
    },
    color: '#22C55E',
    tagline: 'Experiência completa',
    features: [
      'Tudo do Eco Plus',
      'Relatórios profissionais em PDF',
      'Insights com inteligência artificial',
      'Previsão de consumo',
      'Simulador de cenários',
      'Eco Impacto (gamificação)',
    ],
  },
];

const businessPlans: PlanDetail[] = [
  {
    name: 'Eco Business',
    pricing: {
      monthly: 'R$ 99',
      annual: 'R$ 79',
      annualTotal: 'R$ 949',
      annualSavings: 'Economia de R$ 239',
    },
    color: '#8B5CF6',
    tagline: 'Solução corporativa completa',
    features: [
      'Aparelhos e metas ilimitados',
      'Histórico completo e relatórios',
      'Até 5 usuários por conta',
      'Suporte prioritário 24h',
      'API para integração',
      'Dados exportáveis (CSV/JSON/PDF)',
      'Painel administrativo multi-usuário',
    ],
  },
];

function PlanCard({ plan, annual, colors }: { plan: PlanDetail; annual: boolean; colors: any }) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: borderRadius.card,
        padding: spacing.lg,
        marginBottom: spacing.md,
        ...shadows.card,
        borderTopWidth: 3,
        borderTopColor: plan.color,
        position: 'relative',
        overflow: 'visible',
      }}
    >
      {plan.recommended && (
        <View style={{
          position: 'absolute', top: -10, right: 20,
          backgroundColor: plan.color,
          paddingHorizontal: 14, paddingVertical: 4,
          borderRadius: 999,
          zIndex: 10,
        }}>
          <Text style={{
            fontFamily: 'Poppins', fontSize: 10, fontWeight: '700',
            color: '#FFFFFF', letterSpacing: 0.5,
          }}>RECOMENDADO</Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
        <View>
          <Text style={{
            fontFamily: 'Poppins', fontSize: 16, fontWeight: '700',
            color: colors.text.dark, marginBottom: 2,
          }}>{plan.name}</Text>
          <Text style={{
            fontFamily: 'Poppins', fontSize: 13, color: colors.text.tertiary,
          }}>{plan.tagline}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={{
              fontFamily: 'Poppins', fontSize: 28, fontWeight: '800',
              color: plan.color,
            }}>
              {annual && plan.name !== 'Eco Free' ? plan.pricing.annual : plan.pricing.monthly}
            </Text>
            {plan.name !== 'Eco Free' && (
              <Text style={{
                fontFamily: 'Poppins', fontSize: 13, fontWeight: '500',
                color: colors.text.tertiary, marginLeft: 4,
              }}>/mês</Text>
            )}
          </View>
          {annual && plan.pricing.annualSavings ? (
            <View style={{
              backgroundColor: plan.color + '15',
              borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2,
              marginTop: 4,
            }}>
              <Text style={{
                fontFamily: 'Poppins', fontSize: 10, fontWeight: '600',
                color: plan.color,
              }}>{plan.pricing.annualSavings}</Text>
            </View>
          ) : null}
          {annual && plan.name !== 'Eco Free' && (
            <Text style={{
              fontFamily: 'Poppins', fontSize: 12, color: colors.text.tertiary,
              marginTop: 2,
            }}>{plan.pricing.annualTotal}/ano</Text>
          )}
        </View>
      </View>

      <View style={{
        width: '100%', height: 1, backgroundColor: colors.divider,
        marginBottom: spacing.md,
      }} />

      {plan.features.map((feat, fi) => (
        <View key={fi} style={{
          flexDirection: 'row', alignItems: 'center',
          marginBottom: fi < plan.features.length - 1 ? spacing.sm : 0,
        }}>
          <View style={{
            width: 20, height: 20, borderRadius: 10,
            backgroundColor: plan.color + '20',
            alignItems: 'center', justifyContent: 'center',
            marginRight: spacing.sm,
          }}>
            <MaterialCommunityIcons name="check" size={13} color={plan.color} />
          </View>
          <Text style={{
            fontFamily: 'Poppins', fontSize: 14, color: colors.text.dark,
            flex: 1,
          }}>{feat}</Text>
        </View>
      ))}
    </View>
  );
}

export default function Plans() {
  const { colors } = useTheme();
  const [annual, setAnnual] = useState(false);

  function renderPlans(planList: PlanDetail[]) {
    return planList.map((plan, i) => (
      <PlanCard key={i} plan={plan} annual={annual} colors={colors} />
    ));
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl * 2 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ marginBottom: spacing.lg }}>
        <Text style={{
          fontFamily: 'Poppins', fontSize: 11, fontWeight: '700', letterSpacing: 1.4,
          textTransform: 'uppercase', marginBottom: spacing.xs, color: colors.text.muted,
        }}>Planos</Text>
        <Text style={{
          fontFamily: 'Poppins', fontSize: 28, fontWeight: '700', color: colors.text.primary,
          marginBottom: spacing.xs,
        }}>Escolha seu plano</Text>
        <Text style={{
          fontFamily: 'Poppins', fontSize: 15, color: colors.text.tertiary, lineHeight: 22,
        }}>
          Quanto mais completo o plano, mais ferramentas para economizar energia.
        </Text>
      </View>

      <View style={{
        flexDirection: 'row', backgroundColor: colors.surfaceLight,
        borderRadius: 999, padding: 3, marginBottom: spacing.lg,
        alignSelf: 'center',
      }}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setAnnual(false)}
          style={{
            paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
            borderRadius: 999,
            backgroundColor: !annual ? colors.green.primary : 'transparent',
          }}
        >
          <Text style={{
            fontFamily: 'Poppins', fontSize: 13, fontWeight: '700',
            color: !annual ? '#FFFFFF' : colors.text.secondary,
          }}>Mensal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setAnnual(true)}
          style={{
            paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
            borderRadius: 999,
            backgroundColor: annual ? colors.green.primary : 'transparent',
            flexDirection: 'row', alignItems: 'center',
          }}
        >
          <Text style={{
            fontFamily: 'Poppins', fontSize: 13, fontWeight: '700',
            color: annual ? '#FFFFFF' : colors.text.secondary,
          }}>Anual</Text>
          {annual && (
            <View style={{
              backgroundColor: '#FFFFFF', borderRadius: 999,
              paddingHorizontal: 8, paddingVertical: 1, marginLeft: 6,
            }}>
              <Text style={{
                fontFamily: 'Poppins', fontSize: 9, fontWeight: '700',
                color: colors.green.primary,
              }}>-17%</Text>
            </View>
          )}
          {!annual && (
            <View style={{
              backgroundColor: colors.green.primary + '30', borderRadius: 999,
              paddingHorizontal: 8, paddingVertical: 1, marginLeft: 6,
            }}>
              <Text style={{
                fontFamily: 'Poppins', fontSize: 9, fontWeight: '700',
                color: '#FFFFFF',
              }}>-17%</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {renderPlans(consumerPlans)}

      <View style={{ marginTop: spacing.lg, marginBottom: spacing.md }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          marginBottom: spacing.xs,
        }}>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.divider }} />
          <View style={{
            backgroundColor: colors.green.primary + '15',
            borderRadius: 999, paddingHorizontal: 16, paddingVertical: 6,
            marginHorizontal: spacing.sm,
            flexDirection: 'row', alignItems: 'center',
          }}>
            <MaterialCommunityIcons name="domain" size={18} color={colors.green.primary} style={{ marginRight: 6 }} />
            <Text style={{
              fontFamily: 'Poppins', fontSize: 12, fontWeight: '700',
              color: colors.green.primary, letterSpacing: 0.8,
            }}>PARA EMPRESAS</Text>
          </View>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.divider }} />
        </View>
        <Text style={{
          fontFamily: 'Poppins', fontSize: 13, color: colors.text.tertiary,
          textAlign: 'center', marginTop: spacing.xs,
        }}>
          Soluções corporativas para reduzir custos e emissões
        </Text>
      </View>

      {renderPlans(businessPlans)}

      {/* Contact note for larger teams */}
      <View style={{
        backgroundColor: colors.surfaceLight,
        borderRadius: borderRadius.card,
        padding: spacing.lg,
        alignItems: 'center',
        marginTop: spacing.sm,
      }}>
        <MaterialCommunityIcons name="forum-outline" size={28} color={colors.green.primary} />
        <Text style={{
          fontFamily: 'Poppins', fontSize: 15, fontWeight: '600',
          color: colors.text.primary, marginTop: spacing.sm, textAlign: 'center',
        }}>
          Precisa de mais usuários ou plano personalizado?
        </Text>
        <Text style={{
          fontFamily: 'Poppins', fontSize: 13, color: colors.text.tertiary,
          textAlign: 'center', marginTop: spacing.xs, lineHeight: 20,
        }}>
          Entre em contato conosco para uma solução sob medida para sua empresa.
        </Text>
        <View style={{
          backgroundColor: colors.green.primary + '15',
          borderRadius: 999, paddingHorizontal: 20, paddingVertical: 10,
          marginTop: spacing.md,
        }}>
          <Text style={{
            fontFamily: 'Poppins', fontSize: 13, fontWeight: '700',
            color: colors.green.primary,
          }}>
            ecopoweroficial2026@gmail.com
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
