import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import i18n from '@/constants/i18n';
import { textoEstado, useColores } from '@/constants/Colors';
import { IconoEstado, haceCuanto } from '@/components/ui';
import type { Reporte } from '@/services/api';

// Si el reporte se creó sin texto, `contenido` es la etiqueta de la categoría
// guardada en el idioma de quien lo creó ("Mucha fila"). Ese texto no se
// muestra: la categoría ya aparece traducida arriba. El texto libre que
// escribe la gente sí se muestra tal cual (no se traduce).
export function textoDelReporte(reporte: Reporte): string | null {
  const clave = `createReport.categorias.${reporte.categoria_reporte}`;
  const esEtiqueta = ['es', 'en'].some((lng) => i18n.t(clave, { lng }) === reporte.contenido);
  return esEtiqueta ? null : reporte.contenido;
}

export function ReportCard({ reporte }: { reporte: Reporte }) {
  const { t } = useTranslation();
  const { oscuro, secundario } = useColores();
  const texto = textoDelReporte(reporte);
  const votos = reporte.votos_positivos ?? 0;
  const comentarios = reporte.total_comentarios ?? 0;
  return (
    <View className="flex-row items-center gap-4 rounded-[20px] border border-borde bg-tarjeta p-4">
      <IconoEstado categoria={reporte.categoria_reporte} />
      <View className="flex-1">
        <View className="flex-row items-center justify-between gap-2">
          <Text
            className="flex-1 font-nunito8 text-[13px]"
            style={{ color: textoEstado(reporte.categoria_reporte, oscuro) }}
            numberOfLines={1}
          >
            {t(`createReport.categorias.${reporte.categoria_reporte}`, reporte.categoria_reporte)}
          </Text>
          <Text className="font-nunito8 text-[13px] text-secundario">{haceCuanto(reporte.fecha_registro, t)}</Text>
        </View>
        {reporte.lugar?.nombre ? (
          <Text className="mt-0.5 font-nunito8 text-[17px] text-texto" numberOfLines={1}>
            {reporte.lugar.nombre}
          </Text>
        ) : null}
        {texto ? (
          <Text className="mt-0.5 font-nunito text-[15px] text-secundario" numberOfLines={1}>
            {texto}
          </Text>
        ) : null}
        {votos > 0 || comentarios > 0 ? (
          <View className="mt-1 flex-row items-center gap-3">
            {votos > 0 ? (
              <View className="flex-row items-center gap-1">
                <Ionicons name="thumbs-up-outline" size={14} color={secundario} />
                <Text className="font-nunito8 text-[13px] text-secundario">{votos}</Text>
              </View>
            ) : null}
            {comentarios > 0 ? (
              <View className="flex-row items-center gap-1">
                <Ionicons name="chatbubble-outline" size={14} color={secundario} />
                <Text className="font-nunito8 text-[13px] text-secundario">{comentarios}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default ReportCard;
