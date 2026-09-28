import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { MapaMaply } from '@/components/MapaMaply';
import { textoDelReporte } from '@/components/ReportCard';
import { BotonRedondo, Boton, ICONOS_ESTADO, haceCuanto, volver } from '@/components/ui';
import { colorEstado, textoEstado, useColores } from '@/constants/Colors';
import { denunciarReporte, getReporteDetalle, getUsuarioActual, getEstadoActualLugar, traducirReporte, type Reporte, type EstadoActualLugar } from '@/services/api';

export default function ReportDetailsScreen() {
  const { t, i18n } = useTranslation();
  const c = useColores();
  const insets = useSafeAreaInsets();
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

  // "Ver traducción": al idioma actual de la app. Si cambia el idioma se
  // vuelve al original, para no mostrar una traducción al idioma anterior.
  const [traduccion, setTraduccion] = useState<string | null>(null);
  const [traduciendo, setTraduciendo] = useState(false);
  useEffect(() => setTraduccion(null), [i18n.language]);

  async function onTraducir() {
    if (traduccion) return setTraduccion(null);
    setTraduciendo(true);
    try {
      setTraduccion((await traducirReporte(id!, i18n.language === 'en' ? 'en' : 'es')).texto);
    } catch (e: any) {
      Alert.alert(e.message);
    } finally {
      setTraduciendo(false);
    }
  }

  // Denunciar (lo exige Apple para contenido publicado por usuarios). Con 3
  // denuncias de usuarios distintos el backend oculta el reporte.
  const enviarDenuncia = (motivo: string) =>
    denunciarReporte(id!, motivo)
      .then(() => Alert.alert(t('reportDetails.reportThanks')))
      .catch((e) => Alert.alert(t('reportDetails.reportError'), e.message));

  const pedirDenuncia = async () => {
    // Sin sesión el backend responde 401 "Falta el token": mejor mandar a login, igual que "+ Nuevo reporte".
    if (!(await getUsuarioActual())) return router.push('/login');
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

  const lat = Number(reporte?.lugar?.latitud);
  const lng = Number(reporte?.lugar?.longitud);
  const hayCoordenadas = !!reporte?.lugar?.latitud && !!reporte?.lugar?.longitud;
  const estado = estadoActual && estadoActual.total_reportes > 0 ? estadoActual : null;
  const nombreCategoria = (cat?: string | null) => t(`createReport.categorias.${cat}`, cat ?? '');

  return (
    <View className="flex-1 bg-fondo">
      {/* Franja de mapa de 250 px con el pin del lugar. */}
      {reporte && hayCoordenadas ? (
        <MapaMaply
          pines={[{ id: reporte.id_reporte, nombre: reporte.lugar!.nombre, latitud: lat, longitud: lng, categoria: reporte.categoria_reporte }]}
          centro={[lng, lat]}
          zoom={15}
          interactivo={false}
          margenOrnamentos={insets.top + 64}
          style={{ height: 250 }}
        />
      ) : (
        <View className="bg-borde" style={{ height: 250 }} />
      )}
      <View className="absolute left-5" style={{ top: insets.top + 8 }}>
        <BotonRedondo icono="chevron-back" onPress={volver} accessibilityLabel={t('reportDetails.back')} />
      </View>

      <View className="-mt-7 flex-1 rounded-t-[28px] bg-superficie">
        {loading ? (
          <ActivityIndicator color={c.boton} className="mt-8" />
        ) : reporte ? (
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 20, flexGrow: 1 }}>
            {reporte.lugar?.categoria ? (
              <Text className="font-nunito8 text-[13px] uppercase tracking-wider text-secundario">
                {t(`selectLugar.categorias.${reporte.lugar.categoria}`, reporte.lugar.categoria)}
              </Text>
            ) : null}
            <Text className="mt-1 font-nunito9 text-[32px] leading-10 text-texto">{reporte.lugar?.nombre}</Text>

            {estado ? (
              <View className="mt-5 rounded-[20px] p-5" style={{ backgroundColor: colorEstado(estado.estado) + (c.oscuro ? '26' : '14') }}>
                <View className="flex-row items-center gap-4">
                  <View
                    className="h-16 w-16 items-center justify-center rounded-[18px]"
                    style={{ backgroundColor: colorEstado(estado.estado) }}
                  >
                    <Ionicons name={ICONOS_ESTADO[estado.estado ?? ''] ?? 'ellipsis-horizontal'} size={30} color="#FFFFFF" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-nunito8 text-[13px] uppercase tracking-wider" style={{ color: textoEstado(estado.estado, c.oscuro) }}>
                      {t('reportDetails.currentStatus')}
                    </Text>
                    <Text className="font-nunito9 text-[28px] leading-9" style={{ color: textoEstado(estado.estado, c.oscuro) }}>
                      {nombreCategoria(estado.estado)}
                    </Text>
                    <Text className="font-nunito text-sm" style={{ color: textoEstado(estado.estado, c.oscuro) }}>
                      {t('reportDetails.basedOn', { cantidad: estado.total_reportes })}
                    </Text>
                  </View>
                </View>
                {(estado.desglose ?? []).map((fila) => (
                  <View key={fila.categoria_reporte} className="mt-3 flex-row items-center gap-3">
                    <Text className="w-32 font-nunito8 text-sm text-texto" numberOfLines={1}>
                      {nombreCategoria(fila.categoria_reporte)}
                    </Text>
                    <View className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: colorEstado(fila.categoria_reporte) + '33' }}>
                      <View
                        className="h-full rounded-full"
                        style={{ width: `${(fila.total / estado.total_reportes) * 100}%`, backgroundColor: colorEstado(fila.categoria_reporte) }}
                      />
                    </View>
                    <Text className="w-6 text-right font-nunito8 text-sm text-texto">{fila.total}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <Text className="mb-2 mt-6 font-nunito9 text-lg text-texto">{t('reportDetails.thisReport')}</Text>
            <View className="rounded-[20px] border border-borde bg-tarjeta p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colorEstado(reporte.categoria_reporte) }} />
                  <Text className="font-nunito8 text-[15px]" style={{ color: textoEstado(reporte.categoria_reporte, c.oscuro) }}>
                    {nombreCategoria(reporte.categoria_reporte)}
                  </Text>
                </View>
                <Text className="font-nunito8 text-[13px] text-secundario">{haceCuanto(reporte.fecha_registro, t)}</Text>
              </View>
              {textoDelReporte(reporte) ? (
                <>
                  <Text className="mt-2 font-nunito text-base leading-6 text-texto">{traduccion ?? textoDelReporte(reporte)}</Text>
                  {traduccion ? (
                    <Text className="mt-1 font-nunito text-xs text-secundario">{t('reportDetails.translatedBy')}</Text>
                  ) : null}
                  <Pressable disabled={traduciendo} onPress={onTraducir} accessibilityRole="button" className="mt-1 min-h-11 justify-center self-start">
                    <Text className="font-nunito8 text-sm text-boton">
                      {traduciendo
                        ? t('reportDetails.translating')
                        : traduccion
                          ? t('reportDetails.seeOriginal')
                          : t('reportDetails.seeTranslation')}
                    </Text>
                  </Pressable>
                </>
              ) : null}
            </View>

            <View className="flex-1 justify-end pt-8">
              <Boton titulo={t('reportDetails.report')} variante="peligro" icono="flag-outline" onPress={pedirDenuncia} />
            </View>
          </ScrollView>
        ) : (
          <Text className="p-5 font-nunito text-base text-secundario">{t('reportDetails.notFound')}</Text>
        )}
      </View>
    </View>
  );
}
