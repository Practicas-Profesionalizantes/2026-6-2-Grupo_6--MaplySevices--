import '@/global.css';
import '@/constants/i18n';

import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Layout raíz de la app. Nada de tabs acá: Maply es una sola pantalla
// principal (mapa + lista de reportes) con pantallas satélite (crear
// reporte, detalle, login, registro) que se abren encima como Stack.
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen
          name="create-report"
          options={{ headerShown: true, title: 'Nuevo reporte' }}
        />
        <Stack.Screen
          name="report-details"
          options={{ headerShown: true, title: 'Detalle del reporte' }}
        />
        <Stack.Screen name="login" options={{ headerShown: true, title: 'Iniciar sesión' }} />
        <Stack.Screen name="register" options={{ headerShown: true, title: 'Crear cuenta' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
