import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Header } from '@/components/Header';
import { MapaMaply, type LugarPin } from '@/components/MapaMaply';
import { ReportCard } from '@/components/ReportCard';
import { getReportes, getUsuarioActual, logout, type Reporte, type Usuario } from '@/services/api';

export default function HomeScreen() {
  const { t } = useTranslation();
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  // useFocusEffect (no useEffect) a propósito: así se recarga la lista y el
  // estado de sesión cada vez que se vuelve a esta pantalla (por ejemplo,
  // después de crear un reporte o de loguearse), no solo al montar.
  useFocusEffect(
    useCallback(() => {
      let activo = true;

      setLoading(true);
      setError(null);
      getReportes()
        .then((data) => activo && setReportes(data))
        .catch((e) => activo && setError(e.message))
        .finally(() => activo && setLoading(false));

      getUsuarioActual().then((u) => activo && setUsuario(u));

      return () => {
        activo = false;
      };
    }, [])
  );

  // Un pin por reporte que tenga lat/lng (el lugar siempre debería
  // tenerlas, pero por las dudas si algún lugar viejo quedó sin cargar
  // coordenadas no rompemos el mapa, solo no le ponemos pin).
  const pines = useMemo<LugarPin[]>(
    () =>
      reportes
        .filter((r) => r.lugar?.latitud && r.lugar?.longitud)
        .map((r) => ({
          id: r.id_reporte,
          nombre: r.lugar!.nombre,
          latitud: Number(r.lugar!.latitud),
          longitud: Number(r.lugar!.longitud),
          categoria: r.categoria_reporte,
        })),
    [reportes]
  );

  function onNuevoReportePress() {
    router.push(usuario ? '/create-report' : '/login');
  }

  function onPinPress(lugar: LugarPin) {
    router.push(`/report-details?id=${lugar.id}`);
  }

  function onLogoutPress() {
    Alert.alert(t('auth.logoutConfirmTitle'), undefined, [
      { text: t('auth.cancel'), style: 'cancel' },
      {
        text: t('auth.logout'),
        style: 'destructive',
        onPress: async () => {
          await logout();
          setUsuario(null);
        },
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-maply-bg" edges={['top']}>
      <Header
        title={t('home.title')}
        rightSlot={
          usuario ? (
            <Pressable onPress={onLogoutPress}>
              <Text className="text-sm font-semibold text-maply-ink">{usuario.nombre}</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => router.push('/login')}>
              <Text className="text-sm font-semibold text-maply-ink">{t('auth.loginLink')}</Text>
            </Pressable>
          )
        }
      />

      <View className="px-5 pt-4">
        <MapaMaply pines={pines} onPinPress={onPinPress} />
      </View>

      <View className="mt-4 flex-row items-center justify-between px-5">
        <Text className="text-base font-semibold text-maply-ink">{t('home.subtitle')}</Text>
        <Pressable onPress={onNuevoReportePress} className="rounded-full bg-maply-violeta px-4 py-2">
          <Text className="text-sm font-semibold text-white">{t('home.newReport')}</Text>
        </Pressable>
      </View>

      <View className="flex-1 px-5 pt-3">
        {loading ? (
          <ActivityIndicator color="#8EC5FC" />
        ) : error ? (
          <Text className="text-maply-muted">{error}</Text>
        ) : (
          <FlatList
            data={reportes}
            keyExtractor={(item) => String(item.id_reporte)}
            renderItem={({ item }) => (
              <Pressable onPress={() => router.push(`/report-details?id=${item.id_reporte}`)}>
                <ReportCard reporte={item} />
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View className="h-3" />}
            ListEmptyComponent={<Text className="text-maply-muted">{t('home.empty')}</Text>}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
