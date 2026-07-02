import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../src/firebase';
import { useDemo } from '../src/contexts/DemoContext';
import * as dataProvider from '../src/services/dataProvider';
import Button from '../src/components/Button';
import Input from '../src/components/Input';
import Loading from '../src/components/Loading';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../src/types/navigation';
import { useTheme } from '../src/contexts/ThemeContext';
import { spacing, borderRadius, shadows } from '../src/theme/designSystem';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ApplianceForm'>;
  route: RouteProp<RootStackParamList, 'ApplianceForm'>;
};

export default function ApplianceForm({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { isDemoMode } = useDemo();
  const applianceId = route.params?.applianceId;
  const isEditing = !!applianceId;

  const [userId, setUserId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);


  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, user => {
      const uid = isDemoMode ? 'demo-user' : (user?.uid || '');
      setUserId(uid);
      if (user || isDemoMode) {
        const unsubApps = dataProvider.subscribeAppliances(uid, list => {
          if (isEditing) {
            const found = list.find(a => a.id === applianceId);
            if (found) {
              setNome(found.nome);
              setDescricao(found.descricao);
            }
            setLoading(false);
            unsubApps();
          } else {
            setLoading(false);
            unsubApps();
          }
        }, isDemoMode);
      } else {
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, [applianceId, isEditing, isDemoMode]);

  async function handleSave() {
    if (!userId) { Alert.alert('Erro', 'Usuário não autenticado.'); return; }
    if (!nome.trim()) { Alert.alert('Atenção', 'O nome do aparelho é obrigatório.'); return; }
    setSaving(true);
    try {
      if (isEditing) {
        await dataProvider.updateAppliance(userId, applianceId!, { nome: nome.trim(), descricao: descricao.trim() }, isDemoMode);
      } else {
        await dataProvider.createAppliance(userId, { nome: nome.trim(), descricao: descricao.trim() }, isDemoMode);
      }
      navigation.goBack();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o aparelho.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Loading message="Carregando..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>
        {isEditing ? 'Editar Aparelho' : 'Novo Aparelho'}
      </Text>
      <Text style={styles.subtitle}>
        {isEditing ? 'Altere as informações do aparelho.' : 'Cadastre um novo aparelho para monitoramento.'}
      </Text>

      <View style={styles.formCard}>
        <Input
          label="Nome do Aparelho"
          placeholder="Ex: Geladeira"
          value={nome}
          onChangeText={setNome}
          autoCapitalize="sentences"
        />
        <Input
          label="Descrição (opcional)"
          placeholder="Ex: Geladeira da cozinha"
          value={descricao}
          onChangeText={setDescricao}
          autoCapitalize="sentences"
        />
        <Button title={saving ? 'Salvando...' : 'Salvar'} onPress={handleSave} disabled={saving} />
        <Button title="Cancelar" onPress={() => navigation.goBack()} variant="outline" style={{ marginTop: 12 }} />
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },
  title: {
    fontFamily: 'Poppins',
    fontSize: 26,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Poppins',
    color: colors.text.tertiary,
    marginBottom: 20,
    fontSize: 15,
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    ...shadows.card,
  },
});
