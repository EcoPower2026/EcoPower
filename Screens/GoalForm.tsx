import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { useDemo } from '../src/contexts/DemoContext';
import * as dataProvider from '../src/services/dataProvider';
import { Appliance, Goal } from '../src/types';
import Button from '../src/components/Button';
import Input from '../src/components/Input';
import Loading from '../src/components/Loading';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../src/types/navigation';
import { useTheme } from '../src/contexts/ThemeContext';
import { spacing, borderRadius, shadows } from '../src/theme/designSystem';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'GoalForm'>;
  route: RouteProp<RootStackParamList, 'GoalForm'>;
};

export default function GoalForm({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { isDemoMode } = useDemo();
  const goalId = route.params?.goalId;
  const isEditing = !!goalId;

  const [userId, setUserId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('');
  const [valorAlvo, setValorAlvo] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [aparelhoId, setAparelhoId] = useState('');
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, user => {
      const uid = isDemoMode ? 'demo-user' : (user?.uid || '');
      setUserId(uid);
      if (user || isDemoMode) {
        const unsubApps = dataProvider.subscribeAppliances(uid, list => {
          setAppliances(list);
        }, isDemoMode);
        if (isEditing) {
          const unsubGoals = dataProvider.subscribeGoals(uid, list => {
            const found = list.find(g => g.id === goalId);
            if (found) {
              setTitulo(found.titulo);
              setValorAlvo(String(found.valorAlvo));
              setDataInicio(found.dataInicio);
              setDataFim(found.dataFim);
              setAparelhoId(found.aparelhoId);
            }
            setLoading(false);
            unsubGoals();
          }, isDemoMode);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, [goalId, isEditing, isDemoMode]);

  async function handleSave() {
    if (!userId) { Alert.alert('Erro', 'Usuário não autenticado.'); return; }
    if (!titulo.trim()) { Alert.alert('Atenção', 'O título da meta é obrigatório.'); return; }
    const valor = Number(valorAlvo);
    if (!valorAlvo.trim() || isNaN(valor) || valor <= 0) { Alert.alert('Atenção', 'Informe um valor alvo válido.'); return; }
    if (!dataInicio.trim()) { Alert.alert('Atenção', 'Informe a data de início.'); return; }
    if (!dataFim.trim()) { Alert.alert('Atenção', 'Informe a data de fim.'); return; }
    setSaving(true);
    try {
      if (isEditing) {
        await dataProvider.updateGoal(userId, goalId!, { titulo: titulo.trim(), valorAlvo: valor, dataInicio: dataInicio.trim(), dataFim: dataFim.trim(), aparelhoId }, isDemoMode);
      } else {
        await dataProvider.createGoal(userId, { titulo: titulo.trim(), valorAlvo: valor, dataInicio: dataInicio.trim(), dataFim: dataFim.trim(), aparelhoId, ativa: true }, isDemoMode);
      }
      navigation.goBack();
    } catch { Alert.alert('Erro', 'Não foi possível salvar a meta.'); }
    finally { setSaving(false); }
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
      <Text style={styles.title}>{isEditing ? 'Editar Meta' : 'Nova Meta'}</Text>
      <Text style={styles.subtitle}>
        {isEditing ? 'Altere as informações da meta.' : 'Defina uma meta de economia de energia.'}
      </Text>

      <View style={styles.formCard}>
        <Input label="Título" placeholder="Ex: Economia na conta de luz" value={titulo} onChangeText={setTitulo} autoCapitalize="sentences" />
        <Input label="Valor Alvo (R$)" placeholder="Ex: 300" value={valorAlvo} onChangeText={setValorAlvo} keyboardType="decimal-pad" />
        <Input label="Data Início" placeholder="AAAA-MM-DD" value={dataInicio} onChangeText={setDataInicio} />
        <Input label="Data Fim" placeholder="AAAA-MM-DD" value={dataFim} onChangeText={setDataFim} />

        <View style={styles.selectSection}>
          <Text style={styles.selectLabel}>Aparelho Associado</Text>
          <View style={styles.selectRow}>
            <TouchableChip
              label="Todos"
              selected={aparelhoId === ''}
              onPress={() => setAparelhoId('')}
              colors={colors}
            />
            {appliances.map(app => (
              <TouchableChip
                key={app.id}
                label={app.nome}
                selected={aparelhoId === app.id}
                onPress={() => setAparelhoId(app.id)}
                colors={colors}
              />
            ))}
          </View>
        </View>

        <Button title={saving ? 'Salvando...' : 'Salvar'} onPress={handleSave} disabled={saving} />
        <Button title="Cancelar" onPress={() => navigation.goBack()} variant="outline" style={{ marginTop: 12 }} />
      </View>
    </ScrollView>
  );
}

function TouchableChip({
  label, selected, onPress, colors,
}: {
  label: string; selected: boolean; onPress: () => void; colors: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
        backgroundColor: selected ? colors.green.primary : colors.surfaceLight,
        borderWidth: 1,
        borderColor: selected ? colors.green.primary : 'rgba(255,255,255,0.1)',
        marginRight: 8, marginBottom: 8,
      }}
    >
      <Text style={{
        fontFamily: 'Poppins', fontWeight: '600', fontSize: 13,
        color: selected ? '#FFFFFF' : colors.text.primary,
      }}>{label}</Text>
    </TouchableOpacity>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },
  title: {
    fontFamily: 'Poppins', fontSize: 26, fontWeight: '700', color: colors.text.primary, marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Poppins', color: colors.text.tertiary, marginBottom: 20, fontSize: 15,
  },
  formCard: {
    backgroundColor: colors.card, borderRadius: borderRadius.card, padding: spacing.md, ...shadows.card,
  },
  selectSection: { marginBottom: 16 },
  selectLabel: {
    fontFamily: 'Poppins', color: colors.text.tertiary, fontSize: 13, marginBottom: 8, fontWeight: '600', letterSpacing: 0.3,
  },
  selectRow: { flexDirection: 'row', flexWrap: 'wrap' },
});
