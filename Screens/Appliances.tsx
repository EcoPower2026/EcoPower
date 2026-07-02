import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../src/firebase';
import { useDemo } from '../src/contexts/DemoContext';
import * as dataProvider from '../src/services/dataProvider';
import { Appliance } from '../src/types';
import Button from '../src/components/Button';
import Loading from '../src/components/Loading';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootStackParamList } from '../src/types/navigation';
import { useTheme } from '../src/contexts/ThemeContext';
import { spacing, borderRadius, shadows } from '../src/theme/designSystem';

type Props = {
  navigation: DrawerNavigationProp<RootStackParamList, 'Appliances'>;
};

export default function Appliances({ navigation }: Props) {
  const { colors } = useTheme();
  const { isDemoMode } = useDemo();
  const [userId, setUserId] = useState<string | null>(null);
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [monitoring, setMonitoring] = useState<{ aparelhoAtivoId: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubAppliances: (() => void) | null = null;
    let unsubMonitoring: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, user => {
      const uid = isDemoMode ? 'demo-user' : (user?.uid || '');
      setUserId(uid);
      if (user || isDemoMode) {
        unsubAppliances = dataProvider.subscribeAppliances(uid, list => {
          setAppliances(list);
          setLoading(false);
        }, isDemoMode);
        unsubMonitoring = dataProvider.subscribeMonitoringState(uid, state => {
          setMonitoring(state);
        }, isDemoMode);
      } else {
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      unsubAppliances?.();
      unsubMonitoring?.();
    };
  }, [isDemoMode]);

  async function handleDelete(item: Appliance) {
    if (!userId) return;
    Alert.alert('Remover Aparelho', `Deseja remover "${item.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: async () => {
          try {
            if (monitoring?.aparelhoAtivoId === item.id) {
              await dataProvider.clearActiveAppliance(userId, isDemoMode);
            }
            await dataProvider.deleteAppliance(userId, item.id, isDemoMode);
          } catch {
            Alert.alert('Erro', 'Não foi possível remover o aparelho.');
          }
        },
      },
    ]);
  }

  async function handleSelectActive(item: Appliance) {
    if (!userId) return;
    try {
      await dataProvider.setActiveAppliance(userId, item.id, isDemoMode);
      Alert.alert('Aparelho Ativo', `"${item.nome}" agora é o aparelho ativo.`);
    } catch {
      Alert.alert('Erro', 'Não foi possível selecionar o aparelho.');
    }
  }

  if (loading) {
    return <Loading message="Carregando aparelhos..." />;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: spacing.sm, color: colors.text.muted }}>APARELHOS</Text>
      <Text style={{
        fontFamily: 'Poppins',
        fontSize: 26,
        fontWeight: '700',
        color: colors.text.primary,
        marginBottom: spacing.lg,
      }}>Meus Aparelhos</Text>

      <Button
        title="+ Novo Aparelho"
        onPress={() => navigation.navigate('ApplianceForm', {})}
      />

      {appliances.length === 0 && (
        <View style={{
          backgroundColor: colors.card,
          borderRadius: borderRadius.card,
          padding: spacing.xl,
          marginTop: spacing.md,
          alignItems: 'center',
          ...shadows.card,
        }}>
          <View style={{
            width: 56, height: 56, borderRadius: 28,
            backgroundColor: colors.text.darkMuted + '15',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: spacing.md,
          }}>
            <MaterialCommunityIcons name="power-plug-off" size={28} color={colors.text.darkMuted} />
          </View>
          <Text style={{
            fontFamily: 'Poppins', color: colors.text.dark, fontWeight: '700', fontSize: 16, marginBottom: spacing.xs,
          }}>Nenhum aparelho cadastrado.</Text>
          <Text style={{
            fontFamily: 'Poppins', color: colors.text.darkMuted, textAlign: 'center', fontSize: 14,
          }}>Cadastre seu primeiro aparelho para começar o monitoramento.</Text>
        </View>
      )}

      {appliances.map(item => {
        const isActive = monitoring?.aparelhoAtivoId === item.id;
        return (
          <View
            key={item.id}
            style={{
              backgroundColor: colors.card,
              borderRadius: borderRadius.card,
              padding: spacing.md,
              marginTop: spacing.md,
              ...shadows.card,
              borderWidth: isActive ? 1.5 : 0,
              borderColor: isActive ? colors.green.primary : 'transparent',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: (isActive ? colors.green.primary : colors.text.darkMuted) + '15',
                alignItems: 'center', justifyContent: 'center',
                marginRight: spacing.sm,
              }}>
                <MaterialCommunityIcons
                  name="power-plug"
                  size={18}
                  color={isActive ? colors.green.primary : colors.text.darkMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={{ fontFamily: 'Poppins', color: colors.text.dark, fontSize: 17, fontWeight: '700', flex: 1 }}>
                    {item.nome}
                  </Text>
                  {isActive && (
                    <View style={{
                      backgroundColor: colors.green.primary,
                      borderRadius: 12,
                      paddingHorizontal: 10, paddingVertical: 4,
                      marginLeft: spacing.sm,
                      flexDirection: 'row', alignItems: 'center',
                    }}>
                      <MaterialCommunityIcons name="check-circle" size={12} color="#FFF" />
                      <Text style={{ color: '#FFFFFF', fontFamily: 'Poppins', fontSize: 11, fontWeight: '700', marginLeft: 4 }}>ATIVO</Text>
                    </View>
                  )}
                </View>
                {item.descricao ? (
                  <Text style={{ fontFamily: 'Poppins', color: colors.text.darkMuted, marginTop: 4, fontSize: 13 }}>{item.descricao}</Text>
                ) : null}
                {item.potencia ? (
                  <Text style={{ fontFamily: 'Poppins', color: colors.text.darkMuted, marginTop: 2, fontSize: 12 }}>
                    {item.potencia}W
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={{ flexDirection: 'row', marginTop: 14, gap: spacing.sm }}>
              {!isActive && (
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: colors.green.primary,
                    borderRadius: borderRadius.md,
                    paddingVertical: 10,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                  }}
                  onPress={() => handleSelectActive(item)}
                >
                  <MaterialCommunityIcons name="play" size={14} color="#FFF" />
                  <Text style={{ color: '#FFFFFF', fontFamily: 'Poppins', fontWeight: '700', fontSize: 13, marginLeft: 4 }}>Selecionar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: colors.surfaceLight,
                  borderRadius: borderRadius.md,
                  paddingVertical: 10,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                }}
                onPress={() => navigation.navigate('ApplianceForm', { applianceId: item.id })}
              >
                <MaterialCommunityIcons name="pencil" size={14} color={colors.green.primary} />
                <Text style={{ color: colors.green.primary, fontFamily: 'Poppins', fontWeight: '700', fontSize: 13, marginLeft: 4 }}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: colors.surfaceLight,
                  borderRadius: borderRadius.md,
                  paddingVertical: 10,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: colors.alert.danger,
                }}
                onPress={() => handleDelete(item)}
              >
                <MaterialCommunityIcons name="delete" size={14} color={colors.alert.danger} />
                <Text style={{ color: colors.alert.danger, fontFamily: 'Poppins', fontWeight: '700', fontSize: 13, marginLeft: 4 }}>Remover</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      <Button
        title="Voltar"
        onPress={() => navigation.goBack()}
        variant="outline"
        style={{ marginTop: spacing.lg }}
      />
    </ScrollView>
  );
}
