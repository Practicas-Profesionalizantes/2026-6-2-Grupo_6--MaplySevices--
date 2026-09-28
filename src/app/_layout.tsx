import '@/global.css';
import '@/constants/i18n';

import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { vars } from 'nativewind';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useReducedMotion } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';

import { Temas, useColores } from '@/constants/Colors';

SplashScreen.preventAutoHideAsync();

// Variables CSS de NativeWind (bg-fondo, text-texto...) armadas desde Colors.ts.
const aVars = (tema: typeof Temas.light) =>
  vars(Object.fromEntries(Object.entries(tema).map(([k, v]) => [`--${k}`, v])));
const VARS = { light: aVars(Temas.light), dark: aVars(Temas.dark) };

// Layout raíz de la app. Nada de tabs acá: Maply es una sola pantalla
// principal (mapa + lista de reportes) con pantallas satélite (crear
// reporte, detalle, login, registro, configuración) que se abren encima
// como Stack. Cada pantalla dibuja su propio título y botón volver.
export default function RootLayout() {
  const c = useColores();
  const sinMovimiento = useReducedMotion();
  const [fuentesListas] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  useEffect(() => {
    if (fuentesListas) SplashScreen.hideAsync();
  }, [fuentesListas]);

  if (!fuentesListas) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={[{ flex: 1, backgroundColor: c.fondo }, VARS[c.oscuro ? 'dark' : 'light']]}>
          <StatusBar style={c.oscuro ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: c.fondo },
              animation: sinMovimiento ? 'none' : 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="bienvenida" options={{ animation: sinMovimiento ? 'none' : 'fade' }} />
            <Stack.Screen
              name="create-report"
              options={{ presentation: 'modal', animation: sinMovimiento ? 'none' : 'slide_from_bottom' }}
            />
          </Stack>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
