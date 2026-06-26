import React, { useEffect, useState } from 'react';
import { StatusBar, LogBox } from 'react-native';

LogBox.ignoreLogs(['InteractionManager has been deprecated']);
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  useFonts,
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import Home from './Screens/Home';
import Cadastro from './Screens/Cadastro';
import Login from './Screens/Login';
import Settings from './Screens/Settings';
import Graphs from './Screens/Graphs';
import Appliances from './Screens/Appliances';
import ApplianceForm from './Screens/ApplianceForm';
import Goals from './Screens/Goals';
import GoalForm from './Screens/GoalForm';
import Alerts from './Screens/Alerts';
import Reports from './Screens/Reports';
import Insights from './Screens/Insights';
import DemoMode from './Screens/DemoMode';
import History from './Screens/History';
import Simulator from './Screens/Simulator';
import Forecast from './Screens/Forecast';
import Comparison from './Screens/Comparison';
import Impact from './Screens/ImpactScreen';
import About from './Screens/About';
import { auth } from './firebase';
import Loading from './src/components/Loading';
import CustomDrawerContent from './src/components/CustomDrawerContent';
import { RootStackParamList } from './src/types/navigation';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { DemoProvider, useDemo } from './src/contexts/DemoContext';
import { EcoImpactProvider } from './src/ecoImpact/EcoImpactContext';
import { useTheme } from './src/contexts/ThemeContext';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator();

function DrawerNavigator() {
  const { colors } = useTheme();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.green.primary,
        headerTitleStyle: { fontFamily: 'Poppins', fontWeight: '700', fontSize: 17 },
        headerShadowVisible: false,
        drawerStyle: {
          width: 280,
          backgroundColor: colors.background,
        },
      }}
    >
      <Drawer.Screen name="Home" component={Home} options={{ title: 'Dashboard' }} />
      <Drawer.Screen name="Settings" component={Settings} options={{ title: 'Configurações' }} />
      <Drawer.Screen name="Graphs" component={Graphs} options={{ title: 'Gráficos' }} />
      <Drawer.Screen name="Appliances" component={Appliances} options={{ title: 'Aparelhos' }} />
      <Drawer.Screen name="Goals" component={Goals} options={{ title: 'Metas' }} />
      <Drawer.Screen name="Alerts" component={Alerts} options={{ title: 'Alertas' }} />
      <Drawer.Screen name="Reports" component={Reports} options={{ title: 'Relatórios' }} />
      <Drawer.Screen name="Insights" component={Insights} options={{ title: 'Insights' }} />
      <Drawer.Screen name="History" component={History} options={{ title: 'Histórico' }} />
      <Drawer.Screen name="Simulator" component={Simulator} options={{ title: 'Simulador' }} />
      <Drawer.Screen name="Forecast" component={Forecast} options={{ title: 'Previsão' }} />
      <Drawer.Screen name="Comparison" component={Comparison} options={{ title: 'Comparativo' }} />
      <Drawer.Screen name="Impact" component={Impact} options={{ title: 'Eco Impacto' }} />
      <Drawer.Screen name="About" component={About} options={{ title: 'Sobre' }} />
    </Drawer.Navigator>
  );
}

function AppNavigator() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const { colors, isDark } = useTheme();
  const { isDemoMode } = useDemo();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  if (initializing) {
    return <Loading message="Verificando autenticação..." />;
  }

  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: colors.green.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.text.primary,
          border: colors.border,
          notification: colors.alert.danger,
        },
        fonts: {
          regular: { fontFamily: 'Poppins', fontWeight: '400' },
          medium: { fontFamily: 'Poppins', fontWeight: '500' },
          bold: { fontFamily: 'Poppins', fontWeight: '700' },
          heavy: { fontFamily: 'Poppins', fontWeight: '800' },
        },
      }}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <Stack.Navigator
        key={user || isDemoMode ? 'auth' : 'guest'}
        initialRouteName={user || isDemoMode ? 'Main' : 'Cadastro'}
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.green.primary,
          headerTitleStyle: { fontFamily: 'Poppins', fontWeight: '700', fontSize: 17 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {user || isDemoMode ? (
          <>
            <Stack.Screen name="Main" component={DrawerNavigator} options={{ headerShown: false }} />
            <Stack.Group screenOptions={{
              presentation: 'modal',
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.green.primary,
              headerTitleStyle: { fontFamily: 'Poppins', fontWeight: '700', fontSize: 17 },
              headerShadowVisible: false,
            }}>
              <Stack.Screen name="ApplianceForm" component={ApplianceForm} options={{ title: 'Aparelho' }} />
              <Stack.Screen name="GoalForm" component={GoalForm} options={{ title: 'Meta' }} />
            </Stack.Group>
          </>
        ) : (
          <>
            <Stack.Screen name="Cadastro" component={Cadastro} options={{ headerShown: false }} />
            <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
            <Stack.Screen name="DemoMode" component={DemoMode} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <DemoProvider>
          <EcoImpactProvider>
            <AppNavigator />
          </EcoImpactProvider>
        </DemoProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
