import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert as RNAlert,
} from 'react-native';
import { Swipeable, ScrollView } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { useDemo } from '../src/contexts/DemoContext';
import * as dataProvider from '../src/services/dataProvider';
import { Alert, Goal, Appliance } from '../src/types';
import Button from '../src/components/Button';
import Loading from '../src/components/Loading';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootStackParamList } from '../src/types/navigation';
import { useTheme } from '../src/contexts/ThemeContext';
import { spacing, borderRadius, shadows, sectionHeader } from '../src/theme/designSystem';

type AlertsProps = {
  navigation: DrawerNavigationProp<RootStackParamList, 'Alerts'>;
};

type FilterNivel = 'todos' | 'info' | 'warning' | 'danger';

const PRIORITY_ORDER = { danger: 0, warning: 1, info: 2 };



export default function Alerts({ navigation }: AlertsProps) {
  const { colors } = useTheme();
  const { isDemoMode } = useDemo();

  const cardColors = {
    danger: { bg: 'rgba(231,76,60,0.08)', border: 'rgba(231,76,60,0.3)', labelBg: 'rgba(231,76,60,0.15)', text: colors.alert.danger },
    warning: { bg: 'rgba(243,156,18,0.08)', border: 'rgba(243,156,18,0.3)', labelBg: 'rgba(243,156,18,0.15)', text: colors.alert.warning },
    info: { bg: 'rgba(46,204,113,0.08)', border: 'rgba(46,204,113,0.3)', labelBg: 'rgba(46,204,113,0.15)', text: colors.alert.info },
  };

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [tarifa, setTarifa] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterNivel>('todos');
  const [readFilter, setReadFilter] = useState<'unread' | 'all'>('unread');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let unsubAlerts: (() => void) | null = null;
    let unsubGoals: (() => void) | null = null;
    let unsubAppliances: (() => void) | null = null;
    let unsubProfile: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, user => {
      const uid = isDemoMode ? 'demo-user' : (user?.uid || '');
      setUserId(uid);
      if (user || isDemoMode) {
        unsubAlerts = dataProvider.subscribeAlerts(uid, list => { setAlerts(list); setLoading(false); }, isDemoMode);
        unsubGoals = dataProvider.subscribeGoals(uid, list => { setGoals(list); }, isDemoMode);
        unsubAppliances = dataProvider.subscribeAppliances(uid, list => { setAppliances(list); }, isDemoMode);
        unsubProfile = dataProvider.subscribeUserProfile(uid, profile => { setTarifa(profile?.tarifaKwh ?? 0); }, isDemoMode);
      } else {
        setLoading(false);
      }
    });

    return () => { unsubAuth(); unsubAlerts?.(); unsubGoals?.(); unsubAppliances?.(); unsubProfile?.(); };
  }, [isDemoMode]);

  const handleGenerateAlerts = async () => {
    if (!userId) return;
    try {
      await dataProvider.generateAutomaticAlerts(userId, goals, appliances, tarifa, isDemoMode);
      RNAlert.alert('Sucesso', 'Alertas gerados com sucesso.');
    } catch { RNAlert.alert('Erro', 'Não foi possível gerar alertas.'); }
  };

  const handleMarkAsRead = async (alertId: string) => {
    if (!userId) return;
    try { await dataProvider.markAsRead(userId, alertId, isDemoMode); }
    catch { RNAlert.alert('Erro', 'Não foi possível marcar como lido.'); }
  };

  const handleDelete = async (alertId: string) => {
    if (!userId) return;
    try { await dataProvider.deleteAlert(userId, alertId, isDemoMode); }
    catch { RNAlert.alert('Erro', 'Não foi possível excluir o alerta.'); }
  };

  const filteredAlerts = alerts
    .filter(a => {
      if (readFilter === 'unread' && a.lido) return false;
      if (filter !== 'todos' && a.nivel !== filter) return false;
      return true;
    })
    .sort((a, b) => PRIORITY_ORDER[a.nivel] - PRIORITY_ORDER[b.nivel]);

  const unreadCount = alerts.filter(a => !a.lido).length;

  const nivelOptions: { key: 'info' | 'warning' | 'danger'; label: string }[] = [
    { key: 'info', label: 'Info' },
    { key: 'warning', label: 'Aviso' },
    { key: 'danger', label: 'Crítico' },
  ];

  if (loading) {
    return <Loading message="Carregando alertas..." />;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
        <MaterialCommunityIcons name="alert-circle" size={18} color={colors.green.primary} style={{ marginRight: spacing.sm }} />
        <Text style={{ ...sectionHeader, color: colors.text.muted, marginBottom: 0 }}>ALERTAS</Text>
        {unreadCount > 0 && (
          <View style={{
            backgroundColor: colors.alert.danger, borderRadius: 10, minWidth: 20, height: 20,
            alignItems: 'center', justifyContent: 'center', marginLeft: spacing.sm, paddingHorizontal: 6,
          }}>
            <Text style={{ color: '#FFFFFF', fontFamily: 'Poppins', fontSize: 11, fontWeight: '700' }}>{unreadCount}</Text>
          </View>
        )}
      </View>
      <Text style={{
        fontFamily: 'Poppins', fontSize: 26, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.xs,
      }}>Alertas</Text>
      <Text style={{
        fontFamily: 'Poppins', fontSize: 15, color: colors.text.tertiary, marginBottom: spacing.lg,
      }}>Alertas inteligentes de consumo energético</Text>

      <View style={{
        flexDirection: 'row', marginBottom: spacing.sm,
        backgroundColor: colors.surfaceLight, borderRadius: 12, padding: 2,
      }}>
        {(['unread', 'all'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => { setReadFilter(tab); if (tab === 'unread') setFilter('todos'); }}
            style={{
              flex: 1, paddingVertical: 8, borderRadius: 10,
              backgroundColor: readFilter === tab ? colors.green.primary : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text style={{
              fontFamily: 'Poppins', color: readFilter === tab ? '#FFFFFF' : colors.text.tertiary,
              fontWeight: '600', fontSize: 13,
            }}>
              {tab === 'unread' ? `Não Lidas (${unreadCount})` : 'Todas'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {readFilter === 'all' && (
        <View style={{ flexDirection: 'row', marginBottom: spacing.md, gap: spacing.sm }}>
          {nivelOptions.map(opt => (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setFilter(opt.key === filter ? 'todos' : opt.key)}
              style={{
                paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
                backgroundColor: filter === opt.key ? cardColors[opt.key].text : colors.surfaceLight,
              }}
            >
              <Text style={{
                fontFamily: 'Poppins', color: filter === opt.key ? '#FFFFFF' : cardColors[opt.key].text,
                fontWeight: '600', fontSize: 13,
              }}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Button title="Gerar Alertas Automáticos" onPress={handleGenerateAlerts} style={{ marginBottom: spacing.md }} />

      {filteredAlerts.length === 0 ? (
        <View style={{
          backgroundColor: colors.card, borderRadius: borderRadius.card,
          padding: spacing.xl, alignItems: 'center', ...shadows.card,
        }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.text.darkMuted + '15', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md }}>
            <MaterialCommunityIcons name="alert-circle" size={28} color={colors.text.darkMuted} />
          </View>
          <Text style={{ fontFamily: 'Poppins', color: colors.text.dark, fontWeight: '700', fontSize: 16, marginBottom: spacing.xs }}>
            Nenhum alerta encontrado
          </Text>
          <Text style={{ fontFamily: 'Poppins', color: colors.text.darkMuted, textAlign: 'center', fontSize: 14 }}>
            {readFilter === 'unread' ? 'Nenhum alerta não lido.' : 'Nenhum alerta encontrado.'}
          </Text>
        </View>
      ) : (
        filteredAlerts.map(alertItem => {
          const clr = cardColors[alertItem.nivel];
          let _swipeable: Swipeable | null = null;
          const actionWidth = !alertItem.lido ? 140 : 70;
          return (
            <Swipeable
              key={alertItem.id}
              ref={ref => { _swipeable = ref; }}
              overshootRight={false}
              renderRightActions={() => (
                <View style={{ width: actionWidth, flexDirection: 'row', alignItems: 'stretch' }}>
                  {!alertItem.lido && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => { _swipeable?.close(); handleMarkAsRead(alertItem.id); }}
                      style={{ flex: 1, backgroundColor: colors.green.dark, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 }}
                    >
                      <MaterialCommunityIcons name="check" size={24} color="#FFF" />
                      <Text style={{ color: '#FFF', fontFamily: 'Poppins', fontSize: 11, marginTop: 4, fontWeight: '700' }}>Lido</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => { _swipeable?.close(); handleDelete(alertItem.id); }}
                    style={{ flex: 1, backgroundColor: colors.alert.danger, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 }}
                  >
                    <MaterialCommunityIcons name="delete" size={24} color="#FFF" />
                    <Text style={{ color: '#FFF', fontFamily: 'Poppins', fontSize: 11, marginTop: 4, fontWeight: '700' }}>Excluir</Text>
                  </TouchableOpacity>
                </View>
              )}
            >
              <View style={{
                backgroundColor: clr.bg, borderRadius: borderRadius.card,
                padding: spacing.md, marginBottom: spacing.sm, ...shadows.card,
                borderWidth: 1, borderColor: !alertItem.lido ? clr.border : 'transparent',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: clr.labelBg }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: clr.text, marginRight: 6 }} />
                    <Text style={{ fontFamily: 'Poppins', color: clr.text, fontSize: 12, fontWeight: '700' }}>
                      {alertItem.nivel === 'danger' ? 'Crítico' : alertItem.nivel === 'warning' ? 'Aviso' : 'Info'}
                    </Text>
                  </View>
                  {!alertItem.lido && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: clr.text }} />
                      <Text style={{ fontFamily: 'Poppins', color: clr.text, fontSize: 10, fontWeight: '600' }}>Não lido</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontFamily: 'Poppins', color: colors.text.primary, fontSize: 16, fontWeight: '700', marginBottom: 4 }}>
                  {alertItem.titulo}
                </Text>
                <Text style={{ fontFamily: 'Poppins', color: colors.text.secondary, fontSize: 14, lineHeight: 20 }}>
                  {alertItem.mensagem}
                </Text>
              </View>
            </Swipeable>
          );
        })
      )}

      <Button title="Voltar" onPress={() => navigation.goBack()} variant="outline" style={{ marginTop: spacing.sm }} />
    </ScrollView>
  );
}
