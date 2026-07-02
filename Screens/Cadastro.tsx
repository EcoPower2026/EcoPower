import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, ImageBackground } from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../src/firebase';
import { createUserProfile } from '../src/services/userService';
import Button from '../src/components/Button';
import Input from '../src/components/Input';
import Loading from '../src/components/Loading';
import { isValidEmail, formatFirebaseError } from '../src/utils/validation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../src/types/navigation';
import { useTheme } from '../src/contexts/ThemeContext';
import { spacing, borderRadius, shadows } from '../src/theme/designSystem';

type CadastroProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Cadastro'>;
};

export default function Cadastro({ navigation }: CadastroProps) {
  const { colors, themeName } = useTheme();
  const isPremium = themeName === 'ecoNaturePremium';
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
    <ImageBackground
      source={require('../assets/fundo-cad-log.png')}
      style={[styles.container, isPremium && { backgroundColor: '#0A1A12' }]}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={[styles.overlay, isPremium && { backgroundColor: 'rgba(0,0,0,0.5)' }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.inner}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.centerWrapper}>
            <View style={[styles.card, isPremium ? { borderRadius: 24, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' } : shadows.card]}>
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

              <Button title="Criar conta" onPress={handleSalvar} style={styles.primaryButton} />

              <Button
                title="Já tenho conta"
                onPress={() => navigation.navigate('Login')}
                variant="outline"
                style={styles.linkButton}
              />
            </View>
          </View>

          <Button
            title="Ver Demonstração"
            onPress={() => navigation.navigate('DemoMode')}
            variant="secondary"
            style={styles.demoButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  inner: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  centerWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  title: {
    fontFamily: 'Poppins',
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: spacing.sm,
  },
  linkButton: {
    marginTop: spacing.sm,
  },
  demoButton: {
    marginTop: spacing.md,
  },
});
