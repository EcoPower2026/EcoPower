import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import { createUserProfile } from '../src/services/userService';
import Button from '../src/components/Button';
import Input from '../src/components/Input';
import Loading from '../src/components/Loading';
import EcoPowerLogo from '../src/components/EcoPowerLogo';
import { isValidEmail, formatFirebaseError } from '../src/utils/validation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../src/types/navigation';
import { useTheme } from '../src/contexts/ThemeContext';
import { spacing, borderRadius } from '../src/theme/designSystem';

type CadastroProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Cadastro'>;
};

export default function Cadastro({ navigation }: CadastroProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSalvar() {
    if (!nome.trim() || !email.trim() || !senha.trim() || !confirmSenha.trim()) {
      Alert.alert('Preencha todos os campos');
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert('Email inválido');
      return;
    }
    if (senha.length < 6) {
      Alert.alert('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (senha !== confirmSenha) {
      Alert.alert('As senhas não coincidem');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      await updateProfile(userCredential.user, { displayName: nome });
      await createUserProfile(userCredential.user.uid, { nome, email });
      setNome('');
      setEmail('');
      setSenha('');
      setConfirmSenha('');
    } catch (error: any) {
      Alert.alert('Erro no cadastro', formatFirebaseError(error.code || ''));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <Loading message="Criando sua conta..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.inner}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginBottom: spacing.xl }}>
          <EcoPowerLogo size="md" />
        </View>

        <Text style={styles.title}>Criar Conta</Text>

        <Input
          label="Nome"
          placeholder="Nome completo"
          value={nome}
          onChangeText={setNome}
          autoCapitalize="sentences"
        />
        <Input
          label="Email"
          placeholder="email@dominio.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <Input
          label="Senha"
          placeholder="Senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />
        <Input
          label="Confirmar senha"
          placeholder="Repita a senha"
          value={confirmSenha}
          onChangeText={setConfirmSenha}
          secureTextEntry
        />

        <Button title="Criar conta" onPress={handleSalvar} />

        <Button
          title="Ver Demonstração"
          onPress={() => navigation.navigate('DemoMode')}
          variant="secondary"
          style={styles.secondaryButton}
        />

        <Button
          title="Já tenho conta"
          onPress={() => navigation.navigate('Login')}
          variant="outline"
          style={styles.secondaryButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    padding: spacing.lg,
    justifyContent: 'center',
    flexGrow: 1,
  },
  title: {
    fontFamily: 'Poppins',
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 26,
    textAlign: 'center',
  },
  secondaryButton: {
    marginTop: 12,
  },
});
