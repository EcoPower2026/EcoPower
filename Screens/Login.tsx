import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ImageBackground } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import Button from '../src/components/Button';
import Input from '../src/components/Input';
import Loading from '../src/components/Loading';
import { isValidEmail, formatFirebaseError } from '../src/utils/validation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../src/types/navigation';
import { useTheme } from '../src/contexts/ThemeContext';
import { spacing, borderRadius, shadows } from '../src/theme/designSystem';

type LoginProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export default function Login({ navigation }: LoginProps) {
  const { colors, themeName } = useTheme();
  const isPremium = themeName === 'ecoNaturePremium';
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
    <ImageBackground
      source={require('../assets/fundo-cad-log.png')}
      style={[styles.container, isPremium && { backgroundColor: '#0A1A12' }]}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={[styles.overlay, isPremium && { backgroundColor: 'rgba(0,0,0,0.5)' }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.inner}>
          <View style={styles.centerWrapper}>
            <View style={[styles.card, isPremium ? { borderRadius: 24, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' } : shadows.card]}>
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

              <Button title="Entrar" onPress={handleLogin} style={styles.primaryButton} />

              <Button
                title="Não tenho conta"
                onPress={() => navigation.navigate('Cadastro')}
                variant="outline"
                style={styles.linkButton}
              />
            </View>
          </View>

          <Button
            title="Explorar Demonstração"
            onPress={() => navigation.navigate('DemoMode')}
            variant="secondary"
            style={styles.demoButton}
          />
        </View>
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
    flex: 1,
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
