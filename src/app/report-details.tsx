import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { denunciarReporte, getReporteDetalle, getEstadoActualLugar, type Reporte, type EstadoActualLugar } from '@/services/api';

export default function ReportDetailsScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [estadoActual, setEstadoActual] = useState<EstadoActualLugar | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getReporteDetalle(id)
      .then(setReporte)
      .finally(() => setLoading(false));
  }, [id]);

  // Una vez que sabemos a qué lugar pertenece el reporte, pedimos el
  // "estado actual" (resumen de los reportes de la última hora para ese
  // lugar) — la métrica de espera vigente, no solo este reporte puntual.
  useEffect(() => {
    if (!reporte?.id_lugar) return;
    getEstadoActualLugar(reporte.id_lugar)
      .then(setEstadoActual)
      .catch(() => setEstadoActual(null));
  }, [reporte?.id_lugar]);

  // Denunciar (lo exige Apple para contenido publicado por usuarios). Con 3
  // denuncias de usuarios distintos el backend oculta el reporte.
  const enviarDenuncia = (motivo: string) =>
    denunciarReporte(id!, motivo)
      .then(() => Alert.alert(t('reportDetails.reportThanks')))
      .catch((e) => Alert.alert(t('reportDetails.reportError'), e.message));

  const pedirDenuncia = () => {
    // Alert.alert en web no muestra botones (igual que en Configuración).
    if (Platform.OS === 'web') {
      if (window.confirm(t('reportDetails.reportTitle'))) enviarDenuncia('Inapropiado');
      return;
    }
    Alert.alert(t('reportDetails.reportTitle'), undefined, [
      { text: t('reportDetails.reasonFalse'), onPress: () => enviarDenuncia('Información falsa') },
      { text: t('reportDetails.reasonOffensive'), onPress: () => enviarDenuncia('Ofensivo o spam') },
      { text: t('reportDetails.cancel'), style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-maply-bg px-5 pt-4">
      {loading ? (
        <ActivityIndicator color="#8EC5FC" />
      ) : reporte ? (
        <>
          <View className="rounded-2xl border border-maply-card-border bg-white p-4">
            <Text className="text-xs font-semibold uppercase text-maply-muted">
              {reporte.categoria_reporte}
            </Text>
            <Text className="mt-2 text-base text-maply-ink">{reporte.contenido}</Text>
            <Text className="mt-2 text-sm text-maply-muted">{reporte.fecha_registro}</Text>
          </View>

          {estadoActual && estadoActual.total_reportes > 0 ? (
            <View className="mt-4 rounded-2xl border border-maply-card-border bg-white p-4">
              <Text className="text-xs font-semibold uppercase text-maply-muted">
                {t('reportDetails.currentStatus')}
              </Text>
              <Text className="mt-2 text-base font-semibold text-maply-ink">
                {t(`createReport.categorias.${estadoActual.estado}`, estadoActual.estado ?? '')}
              </Text>
              <Text className="mt-1 text-sm text-maply-muted">
                {t('reportDetails.basedOn', { cantidad: estadoActual.total_reportes })}
              </Text>
            </View>
          ) : null}

          <Pressable onPress={pedirDenuncia} accessibilityRole="button" className="mt-6 self-center p-2">
            <Text className="text-sm font-semibold text-red-600 underline">{t('reportDetails.report')}</Text>
          </Pressable>
        </>
      ) : (
        <Text className="text-maply-muted">No se encontró el reporte.</Text>
      )}
    </SafeAreaView>
  );
}
