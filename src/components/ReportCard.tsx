import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/Colors';
import type { Reporte } from '@/services/api';

export function ReportCard({ reporte }: { reporte: Reporte }) {
  const { t } = useTranslation();
  const color = (Colors.categoria as Record<string, string>)[reporte.categoria_reporte] ?? Colors.muted;
  return (
    <View
      className="rounded-2xl border border-maply-card-border bg-white p-4"
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      <Text className="text-xs font-semibold uppercase text-maply-muted">
        {t(`createReport.categorias.${reporte.categoria_reporte}`, reporte.categoria_reporte)}
      </Text>
      <Text className="mt-1 text-base text-maply-ink">{reporte.contenido}</Text>
      {reporte.lugar?.nombre ? (
        <Text className="mt-1 text-sm text-maply-muted">{reporte.lugar.nombre}</Text>
      ) : null}
    </View>
  );
}

export default ReportCard;
