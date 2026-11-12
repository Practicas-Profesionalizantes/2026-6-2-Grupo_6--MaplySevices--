import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Encabezado, EstadoVacio, IconoEstado, haceCuanto } from '@/components/ui';
import { useColores } from '@/constants/Colors';
import { getNotificaciones, marcarNotificacionesLeidas, type Notificacion } from '@/services/api';

// Avisos de reportes nuevos en los lugares guardados en favoritos.
// Al abrir la pantalla se marcan todas como leídas (el punto azul queda
// visible esta vez para que se note cuáles eran nuevas).
export default function NotificacionesScreen() {
  const { t } = useTranslation();
  const c = useColores();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [intento, setIntento] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      setLoading(true);
      setError(false);
      getNotificaciones()
        .then((lista) => {
          if (!activo) return;
          setNotificaciones(lista);
          if (lista.some((n) => !n.leida)) marcarNotificacionesLeidas().catch(() => {});
        })
        .catch(() => activo && setError(true))
        .finally(() => activo && setLoading(false));
      return () => {
        activo = false;
      };
    }, [intento])
  );

  return (
    <SafeAreaView className="flex-1 bg-fondo px-5 pt-4">
      <Encabezado titulo={t('community.notifications')} label={t('reportDetails.back')} />
      <Pressable onPress={() => router.push('/favoritos')} accessibilityRole="button" className="mb-4 min-h-11 flex-row items-center gap-2 self-start">
        <Ionicons name="star-outline" size={18} color={c.enlace} />
        <Text className="font-nunito8 text-[15px] text-enlace">{t('community.myFavorites')}</Text>
      </Pressable>

      {loading ? (
        <ActivityIndicator color={c.boton} />
      ) : error ? (
        <EstadoVacio
          icono="cloud-offline-outline"
          titulo={t('community.notificationsError')}
          detalle={t('common.checkConnection')}
          accion={t('common.retry')}
          onAccion={() => setIntento((i) => i + 1)}
        />
      ) : (
        <FlatList
          data={notificaciones}
          keyExtractor={(n) => String(n.id_notificacion)}
          ItemSeparatorComponent={() => <View className="h-2.5" />}
          ListEmptyComponent={
            <EstadoVacio icono="notifications-outline" titulo={t('community.noNotifications')} detalle={t('community.noNotificationsHint')} />
          }
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => {
            const categoria = item.categoria_reporte ? t(`createReport.categorias.${item.categoria_reporte}`, item.categoria_reporte) : '';
            const texto = t('community.newReportIn', { lugar: item.lugar_nombre ?? '—', categoria });
            return (
              <Pressable
                onPress={() => item.id_reporte && router.push(`/report-details?id=${item.id_reporte}`)}
                accessibilityRole="button"
                accessibilityLabel={`${texto}, ${haceCuanto(item.fecha_notificacion, t)}`}
                className="flex-row items-center gap-4 rounded-[20px] border border-borde bg-tarjeta p-4"
              >
                <IconoEstado categoria={item.categoria_reporte ?? 'otro'} tamano={44} />
                <View className="flex-1">
                  <Text className="font-nunito8 text-base text-texto">{texto}</Text>
                  <Text className="font-nunito text-sm text-secundario">{haceCuanto(item.fecha_notificacion, t)}</Text>
                </View>
                {!item.leida ? <View className="h-2.5 w-2.5 rounded-full bg-boton" accessibilityLabel={t('community.unread')} /> : null}
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
