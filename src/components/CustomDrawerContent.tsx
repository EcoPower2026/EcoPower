import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDemo } from '../contexts/DemoContext';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import * as dataProvider from '../services/dataProvider';
import EcoPowerLogo from './EcoPowerLogo';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, borderRadius } from '../theme/designSystem';

type SectionItem = {
  label: string;
  screen: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

const mainItems: SectionItem[] = [
  { label: 'Dashboard', screen: 'Home', icon: 'view-dashboard-outline' },
  { label: 'Gráficos', screen: 'Graphs', icon: 'chart-line' },
  { label: 'Aparelhos', screen: 'Appliances', icon: 'flash-outline' },
  { label: 'Metas', screen: 'Goals', icon: 'target' },
];

const toolsItems: SectionItem[] = [
  { label: 'Eco Impacto', screen: 'Impact', icon: 'leaf-circle-outline' },
  { label: 'Simulador', screen: 'Simulator', icon: 'calculator-variant' },
  { label: 'Histórico', screen: 'History', icon: 'history' },
  { label: 'Relatórios', screen: 'Reports', icon: 'file-document-outline' },
  { label: 'Previsão', screen: 'Forecast', icon: 'chart-timeline-variant' },
  { label: 'Comparativo', screen: 'Comparison', icon: 'compare' },
  { label: 'Insights', screen: 'Insights', icon: 'lightbulb-on-outline' },
  { label: 'Alertas', screen: 'Alerts', icon: 'alert-circle-outline' },
];

const configItems: SectionItem[] = [
  { label: 'Configurações', screen: 'Settings', icon: 'cog-outline' },
  { label: 'Suporte', screen: 'Support', icon: 'help-circle-outline' },
  { label: 'Planos', screen: 'Plans', icon: 'crown-outline' },
  { label: 'Sobre', screen: 'About', icon: 'information-outline' },
];

const ICON_SIZE = 22;

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { colors, themeName } = useTheme();
  const { isDemoMode, disableDemoMode } = useDemo();
  const insets = useSafeAreaInsets();
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [activeRoute, setActiveRoute] = useState('Home');
  const isPremium = themeName === 'ecoNaturePremium';

  const isActive = (screen: string) => activeRoute === screen;

  useEffect(() => {
    const unsub = (props.navigation as any).addListener('state', (e: any) => {
      const state = e.data.state;
      if (state?.routes?.[state.index]) {
        setActiveRoute(state.routes[state.index].name);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, user => {
      const uid = isDemoMode ? 'demo-user' : (user?.uid || '');
      if (uid) {
        unsub = dataProvider.subscribeAlerts(uid, list => {
          setUnreadAlerts(list.filter(a => !a.lido).length);
        }, isDemoMode);
      }
    });
    return () => {
      unsubAuth();
      unsub?.();
    };
  }, [isDemoMode]);

  const handleNavigate = (screen: string) => {
    setActiveRoute(screen);
    props.navigation.navigate(screen);
    props.navigation.closeDrawer();
  };

  const handleSignOut = async () => {
    if (isDemoMode) {
      disableDemoMode();
    } else {
      await signOut(auth);
    }
  };

  const renderItem = (item: SectionItem, badge?: number) => {
    const active = isActive(item.screen);
    return (
      <TouchableOpacity
        key={item.screen}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 11,
          paddingHorizontal: spacing.md,
          borderRadius: 12,
          marginHorizontal: spacing.sm,
          marginVertical: 2,
          backgroundColor: active ? (isPremium ? 'rgba(34,197,94,0.15)' : 'rgba(46,204,113,0.15)') : 'transparent',
          borderLeftWidth: active ? 4 : 0,
          borderLeftColor: active ? colors.green.primary : 'transparent',
          paddingLeft: active ? spacing.md - 4 : spacing.md,
        }}
        onPress={() => handleNavigate(item.screen)}
        activeOpacity={0.7}
      >
        <View style={{
          width: ICON_SIZE,
          height: ICON_SIZE,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14,
        }}>
          <MaterialCommunityIcons
            name={item.icon}
            size={ICON_SIZE}
            color={active ? colors.green.primary : colors.text.secondary}
          />
        </View>
        <Text
          style={{
            fontFamily: 'Poppins',
            fontSize: 15,
            color: active ? colors.green.primary : colors.text.primary,
            fontWeight: active ? '600' : '400',
            flex: 1,
          }}
        >
          {item.label}
        </Text>
        {badge !== undefined && badge > 0 && (
          <View style={{
            backgroundColor: colors.alert.danger,
            borderRadius: 10,
            minWidth: 20,
            height: 20,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 6,
          }}>
            <Text style={{ color: '#FFFFFF', fontSize: 11, fontFamily: 'Poppins', fontWeight: '700' }}>
              {badge > 99 ? '99+' : badge}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderSection = (title: string, items: SectionItem[], badges?: Record<string, number>) => (
    <>
      <Text
        style={{
          fontFamily: 'Poppins',
          fontSize: 11,
          fontWeight: '700',
          color: colors.text.muted,
          letterSpacing: 1.2,
          paddingHorizontal: spacing.md,
          paddingTop: spacing.lg,
          paddingBottom: spacing.sm,
        }}
      >
        {title}
      </Text>
      {items.map(item => renderItem(item, badges?.[item.screen]))}
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: isPremium ? '#0A1A12' : colors.background, paddingTop: insets.top }}>
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: colors.divider,
          marginBottom: spacing.xs,
        }}
      >
        <EcoPowerLogo size="sm" showTagline={false} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {renderSection('PRINCIPAL', mainItems)}
        <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.md, marginVertical: spacing.xs }} />
        {renderSection('FERRAMENTAS', toolsItems, { Alerts: unreadAlerts })}
        <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.md, marginVertical: spacing.xs }} />
        {renderSection('SISTEMA', configItems)}
      </ScrollView>

      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          borderTopWidth: 1,
          borderTopColor: colors.divider,
        }}
        onPress={handleSignOut}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name="logout"
          size={ICON_SIZE}
          color={colors.text.secondary}
          style={{ marginRight: 14 }}
        />
        <Text
          style={{
            fontFamily: 'Poppins',
            fontSize: 15,
            color: colors.text.secondary,
            fontWeight: '400',
          }}
        >
          {isDemoMode ? 'Sair da Demonstração' : 'Sair'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
