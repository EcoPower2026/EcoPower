import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import Button from '../src/components/Button';
import Input from '../src/components/Input';
import Loading from '../src/components/Loading';
import EcoPowerLogo from '../src/components/EcoPowerLogo';
import { isValidEmail, formatFirebaseError } from '../src/utils/validation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../src/types/navigation';
import { useTheme } from '../src/contexts/ThemeContext';
import { spacing, borderRadius } from '../src/theme/designSystem';

type LoginProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export default function Login({ navigation }: LoginProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !senha.trim()) {
      Alert.alert('Preencha email e senha');
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert('Formato de email inválido');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, senha);
    } catch (error: any) {
      Alert.alert('Erro no login', formatFirebaseError(error.code || ''));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <Loading message="Entrando..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <View style={{ marginBottom: spacing.xl }}>
          <EcoPowerLogo size="md" />
        </View>

        <Text style={styles.title}>Entrar</Text>

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

        <Button title="Entrar" onPress={handleLogin} />

        <Button
          title="Explorar Demonstração"
          onPress={() => navigation.navigate('DemoMode')}
          variant="secondary"
          style={styles.secondaryButton}
        />

        <Button
          title="Não tenho conta"
          onPress={() => navigation.navigate('Cadastro')}
          variant="outline"
          style={styles.secondaryButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Poppins',
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 28,
    textAlign: 'center',
  },
  secondaryButton: {
    marginTop: 12,
  },
});
