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
import { auth } from '../firebase';
import { useDemo } from '../src/contexts/DemoContext';
import * as dataProvider from '../src/services/dataProvider';
import Button from '../src/components/Button';
import Input from '../src/components/Input';
import Loading from '../src/components/Loading';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootStackParamList } from '../src/types/navigation';
import { useTheme } from '../src/contexts/ThemeContext';
import { spacing, borderRadius, shadows, THEMES, ThemeName } from '../src/theme/designSystem';

type SettingsProps = {
  navigation: DrawerNavigationProp<RootStackParamList, 'Settings'>;
};

export default function Settings({ navigation }: SettingsProps) {
  const { colors, themeName, setTheme } = useTheme();
  const { isDemoMode, disableDemoMode } = useDemo();

  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [energyRate, setEnergyRate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function handleSaveProfile() {
    if (!userId) { Alert.alert('Erro', 'Usuário não autenticado.'); return; }
    if (!name.trim()) { Alert.alert('Atenção', 'Informe seu nome.'); return; }
    if (!energyRate.trim()) { Alert.alert('Atenção', 'Informe a tarifa de energia.'); return; }
    setSaving(true);
    try {
      await dataProvider.updateUserProfile(userId, { nome: name.trim(), tarifaKwh: Number(energyRate) }, isDemoMode);
      Alert.alert('Sucesso', 'Configurações salvas com sucesso.');
    } catch { Alert.alert('Erro', 'Não foi possível salvar os dados.'); }
    finally { setSaving(false); }
  }

  useEffect(() => {
    let unsubscribeUser: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, user => {
      const uid = isDemoMode ? 'demo-user' : (user?.uid || '');
      setUserId(uid);
      if (user || isDemoMode) {
        unsubscribeUser = dataProvider.subscribeUserProfile(uid, profile => {
          if (profile) {
            setName(profile.nome ?? '');
            setEnergyRate(profile.tarifaKwh !== undefined ? String(profile.tarifaKwh) : '');
          }
          setLoading(false);
        }, isDemoMode);
      } else { setLoading(false); }
    });
    return () => { unsubscribeAuth(); unsubscribeUser?.(); };
  }, [isDemoMode]);

  if (loading) {
    return <Loading message="Carregando configurações..." />;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: spacing.sm, color: colors.text.muted }}>Personalize o sistema</Text>
      <Text style={{
        fontFamily: 'Poppins', fontSize: 26, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.lg,
      }}>Configurações</Text>

        <View style={{
          backgroundColor: colors.card, borderRadius: borderRadius.card,
          padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
        }}>
          <Text style={{
            fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.darkMuted,
            marginBottom: spacing.md, letterSpacing: 0.5, textTransform: 'uppercase',
          }}>Aparência</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.green.primary + '15', alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm }}>
              <MaterialCommunityIcons name="palette" size={18} color={colors.green.primary} />
            </View>
            <View>
              <Text style={{ fontFamily: 'Poppins', fontSize: 15, fontWeight: '600', color: colors.text.dark }}>Tema</Text>
              <Text style={{ fontFamily: 'Poppins', fontSize: 13, color: colors.text.darkMuted, marginTop: 2 }}>
                {themeName === 'ecoPowerDark' ? 'Escuro Padrão' :
                 themeName === 'ecoPowerLight' ? 'Claro Padrão' :
                 themeName === 'ecoNature' ? 'Eco Nature' : 'Aurora Energy'}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {(Object.keys(THEMES) as ThemeName[]).map((key) => {
              const t = THEMES[key];
              const isActive = themeName === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setTheme(key)}
                  style={{
                    flex: 1,
                    minWidth: '45%',
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    borderRadius: borderRadius.md,
                    backgroundColor: isActive ? colors.green.primary + '20' : colors.surfaceLight,
                    borderWidth: 1.5,
                    borderColor: isActive ? colors.green.primary : colors.border,
                    alignItems: 'center',
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{
                    width: 28, height: 28, borderRadius: 14,
                    backgroundColor: isActive ? colors.green.primary : colors.text.muted + '30',
                    alignItems: 'center', justifyContent: 'center',
                    marginBottom: 6,
                  }}>
                    {isActive && (
                      <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                    )}
                  </View>
                  <Text style={{
                    fontFamily: 'Poppins', fontSize: 13, fontWeight: '600',
                    color: isActive ? colors.green.primary : colors.text.secondary,
                    textAlign: 'center',
                  }}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

      {isDemoMode && (
        <View style={{
          backgroundColor: colors.card, borderRadius: borderRadius.card,
          padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
        }}>
          <Text style={{
            fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.darkMuted,
            marginBottom: spacing.md, letterSpacing: 0.5, textTransform: 'uppercase',
          }}>Modo Demonstração</Text>
          <Text style={{ fontFamily: 'Poppins', color: colors.text.darkSecondary, lineHeight: 20, marginBottom: spacing.md, fontSize: 14 }}>
            Você está utilizando o sistema em modo demonstração com dados simulados.
          </Text>
          <Button title="Simulador de Consumo" onPress={() => navigation.navigate('Simulator')} />
          <View style={{ marginTop: spacing.sm }}>
            <Button title="Sair da Demonstração" onPress={() => { disableDemoMode(); navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Cadastro' }] }); }} variant="outline" />
          </View>
        </View>
      )}

      <View style={{
        backgroundColor: colors.card, borderRadius: borderRadius.card,
        padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
      }}>
        <Text style={{
          fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.darkMuted,
          marginBottom: spacing.md, letterSpacing: 0.5, textTransform: 'uppercase',
        }}>Perfil do Usuário</Text>
        <Input label="Nome" placeholder="Digite seu nome" value={name} onChangeText={setName} />
        <View style={{ marginTop: spacing.md }}>
          <Input label="Tarifa de Energia (R$/kWh)" placeholder="Ex: 0.95" value={energyRate} onChangeText={setEnergyRate} keyboardType="decimal-pad" />
        </View>
        <View style={{ marginTop: spacing.md }}>
          <Button title={saving ? 'Salvando...' : 'Salvar Configurações'} onPress={handleSaveProfile} disabled={saving} />
        </View>
      </View>

      <View style={{
        backgroundColor: colors.card, borderRadius: borderRadius.card,
        padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
      }}>
        <Text style={{
          fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.darkMuted,
          marginBottom: spacing.md, letterSpacing: 0.5, textTransform: 'uppercase',
        }}>Metas de Economia</Text>
        <Text style={{ fontFamily: 'Poppins', color: colors.text.darkSecondary, lineHeight: 20, marginBottom: spacing.md, fontSize: 14 }}>
          Crie metas de economia de energia e acompanhe seu progresso.
        </Text>
        <Button title="Gerenciar Metas" onPress={() => navigation.navigate('Goals')} />
      </View>

      <View style={{
        backgroundColor: colors.card, borderRadius: borderRadius.card,
        padding: spacing.md, marginBottom: spacing.md, ...shadows.card,
      }}>
        <Text style={{
          fontFamily: 'Poppins', fontSize: 13, fontWeight: '600', color: colors.text.darkMuted,
          marginBottom: spacing.md, letterSpacing: 0.5, textTransform: 'uppercase',
        }}>Relatórios e Alertas</Text>
        <Text style={{ fontFamily: 'Poppins', color: colors.text.darkSecondary, lineHeight: 20, marginBottom: spacing.md, fontSize: 14 }}>
          Acesse relatórios detalhados de consumo e alertas inteligentes.
        </Text>
        <Button title="Relatórios Avançados" onPress={() => navigation.navigate('Reports')} />
        <View style={{ marginTop: spacing.sm }}>
          <Button title="Alertas Inteligentes" onPress={() => navigation.navigate('Alerts')} variant="secondary" />
        </View>
        <View style={{ marginTop: spacing.sm }}>
          <Button title="Insights de Economia" onPress={() => navigation.navigate('Insights')} variant="secondary" />
        </View>
      </View>
    </ScrollView>
  );
}
