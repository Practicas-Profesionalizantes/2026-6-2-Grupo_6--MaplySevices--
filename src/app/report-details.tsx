import { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

import { getReporteDetalle, type Reporte } from '@/services/api';

export default function ReportDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getReporteDetalle(id)
      .then(setReporte)
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <SafeAreaView className="flex-1 bg-maply-bg px-5 pt-4">
      {loading ? (
        <ActivityIndicator color="#8EC5FC" />
      ) : reporte ? (
        <View className="rounded-2xl border border-maply-card-border bg-white p-4">
          <Text className="text-xs font-semibold uppercase text-maply-muted">
            {reporte.categoria_reporte}
          </Text>
          <Text className="mt-2 text-base text-maply-ink">{reporte.contenido}</Text>
          <Text className="mt-2 text-sm text-maply-muted">{reporte.fecha_registro}</Text>
        </View>
      ) : (
        <Text className="text-maply-muted">No se encontró el reporte.</Text>
      )}
    </SafeAreaView>
  );
}
