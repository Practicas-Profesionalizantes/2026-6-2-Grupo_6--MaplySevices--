import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { MapaMaply } from '@/components/MapaMaply';
import { textoDelReporte } from '@/components/ReportCard';
import { Aviso, BotonRedondo, Boton, EstadoVacio, HojaInferior, ICONOS_ESTADO, OpcionHoja, Tocable, haceCuanto, volver, type IconName } from '@/components/ui';
import { colorEstado, textoEstado, useColores } from '@/constants/Colors';
import {
  cambiarFavorito,
  crearComentario,
  denunciarReporte,
  eliminarComentario,
  eliminarReporte,
  getComentarios,
  getEstadoActualLugar,
  getFavoritos,
  getReporteDetalle,
  getUsuarioActual,
  traducirReporte,
  votarReporte,
  type Comentario,
  type EstadoActualLugar,
  type Reporte,
  type Usuario,
} from '@/services/api';

export default function ReportDetailsScreen() {
  const { t, i18n } = useTranslation();
  const c = useColores();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [estadoActual, setEstadoActual] = useState<EstadoActualLugar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(false);
    getReporteDetalle(id)
      .then(setReporte)
      // 404 = el reporte no existe (o lo ocultaron por denuncias); otro error = conexión.
      .catch((e) => setError(!/no encontrado/i.test(e.message)))
      .finally(() => setLoading(false));
  }, [id, intento]);

  // Una vez que sabemos a qué lugar pertenece el reporte, pedimos el
  // "estado actual" (resumen de los reportes de la última hora para ese
  // lugar) — la métrica de espera vigente, no solo este reporte puntual.
  useEffect(() => {
    if (!reporte?.id_lugar) return;
    getEstadoActualLugar(reporte.id_lugar)
      .then(setEstadoActual)
      .catch(() => setEstadoActual(null));
  }, [reporte?.id_lugar]);

  // --- Comunidad: favorito, votos y comentarios (Términos, punto 3) ---
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [esFavorito, setEsFavorito] = useState(false);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [comentando, setComentando] = useState(false);
  const [errorComentario, setErrorComentario] = useState<string | null>(null);
  const [comentarioABorrar, setComentarioABorrar] = useState<Comentario | null>(null);
  const [votando, setVotando] = useState(false);
  const [errorComunidad, setErrorComunidad] = useState<string | null>(null);

  useEffect(() => {
    getUsuarioActual().then(setUsuario);
  }, []);

  useEffect(() => {
    if (!id) return;
    getComentarios(id).then(setComentarios).catch(() => setComentarios([]));
  }, [id, intento]);

  useEffect(() => {
    if (!usuario || !reporte?.id_lugar) return;
    getFavoritos()
      .then((lista) => setEsFavorito(lista.some((l) => l.id_lugar === reporte.id_lugar)))
      .catch(() => {});
  }, [usuario, reporte?.id_lugar]);

  async function onFavorito() {
    if (!usuario) return router.push('/login');
    if (!reporte) return;
    const nuevo = !esFavorito;
    setEsFavorito(nuevo); // se ve al instante; si falla, vuelve atrás
    setErrorComunidad(null);
    try {
      await cambiarFavorito(reporte.id_lugar, nuevo);
    } catch (e: any) {
      setEsFavorito(!nuevo);
      setErrorComunidad(e.message || t('community.favoriteError'));
    }
  }

  // Tocar el mismo botón otra vez saca el voto.
  async function onVotar(valor: 1 | -1) {
    if (!usuario) return router.push('/login');
    if (!reporte || votando) return;
    setVotando(true);
    setErrorComunidad(null);
    try {
      const votos = await votarReporte(id!, reporte.mi_voto === valor ? 0 : valor);
      setReporte({ ...reporte, ...votos });
    } catch (e: any) {
      setErrorComunidad(e.message || t('community.voteError'));
    } finally {
      setVotando(false);
    }
  }

  async function onComentar() {
    const texto = nuevoComentario.trim();
    if (!texto || comentando) return;
    setComentando(true);
    setErrorComentario(null);
    try {
      const comentario = await crearComentario(id!, texto);
      setComentarios((lista) => [...lista, comentario]);
      setNuevoComentario('');
    } catch (e: any) {
      setErrorComentario(e.message || t('community.commentError'));
    } finally {
      setComentando(false);
    }
  }

  function pedirBorrarComentario(comentario: Comentario) {
    if (Platform.OS === 'web') {
      if (window.confirm(t('community.deleteCommentTitle'))) borrarComentario(comentario);
      return;
    }
    setComentarioABorrar(comentario);
  }

  function borrarComentario(comentario: Comentario) {
    setComentarioABorrar(null);
    eliminarComentario(id!, comentario.id_comentario)
      .then(() => setComentarios((lista) => lista.filter((c) => c.id_comentario !== comentario.id_comentario)))
      .catch((e) => setErrorComunidad(e.message));
  }

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
  // Se usa una hoja propia en lugar de Alert.alert, que en Android se ve
  // con el diálogo gris del sistema y no con el diseño de la app.
  const [hojaDenuncia, setHojaDenuncia] = useState<'cerrada' | 'motivos' | 'enviando' | 'enviada'>('cerrada');
  const [errorDenuncia, setErrorDenuncia] = useState<string | null>(null);
  const cerrarDenuncia = () => {
    setHojaDenuncia('cerrada');
    setErrorDenuncia(null);
  };

  const enviarDenuncia = (motivo: string) => {
    setHojaDenuncia('enviando');
    setErrorDenuncia(null);
    denunciarReporte(id!, motivo)
      .then(() => setHojaDenuncia('enviada'))
      .catch((e) => {
        setErrorDenuncia(e.message || t('reportDetails.reportError'));
        setHojaDenuncia('motivos');
      });
  };

  const pedirDenuncia = async () => {
    // Sin sesión el backend responde 401 "Falta el token": mejor mandar a login, igual que "+ Nuevo reporte".
    if (!(await getUsuarioActual())) return router.push('/login');
    // En web el Modal no se ve igual: se mantiene la confirmación simple del navegador.
    if (Platform.OS === 'web') {
      if (window.confirm(t('reportDetails.reportTitle'))) {
        denunciarReporte(id!, 'Inapropiado')
          .then(() => window.alert(t('reportDetails.reportThanks')))
          .catch((e) => window.alert(e.message));
      }
      return;
    }
    setHojaDenuncia('motivos');
  };

  // Eliminar (MVP-06 y MVP-07): el botón solo aparece si el backend dice
  // que quien mira es el autor o un administrador.
  const [hojaEliminar, setHojaEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);
  const confirmarEliminar = () => {
    setEliminando(true);
    setErrorEliminar(null);
    eliminarReporte(id!)
      .then(() => {
        setHojaEliminar(false);
        volver();
      })
      .catch((e) => setErrorEliminar(e.message || t('reportDetails.deleteError')))
      .finally(() => setEliminando(false));
  };
  const pedirEliminar = () => {
    if (Platform.OS === 'web') {
      if (window.confirm(t('reportDetails.deleteTitle'))) confirmarEliminar();
      return;
    }
    setErrorEliminar(null);
    setHojaEliminar(true);
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

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="-mt-7 flex-1 rounded-t-[28px] bg-superficie">
        {loading ? (
          <ActivityIndicator color={c.boton} className="mt-8" />
        ) : reporte ? (
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 20, flexGrow: 1 }}>
            {reporte.lugar?.categoria ? (
              <Text className="font-nunito8 text-[13px] uppercase tracking-wider text-secundario">
                {t(`selectLugar.categorias.${reporte.lugar.categoria}`, reporte.lugar.categoria)}
              </Text>
            ) : null}
            <View className="mt-1 flex-row items-start gap-3">
              <Text className="flex-1 font-nunito9 text-[32px] leading-10 text-texto">{reporte.lugar?.nombre}</Text>
              <Tocable
                onPress={onFavorito}
                accessibilityLabel={esFavorito ? t('community.unsave') : t('community.save')}
                accessibilityState={{ selected: esFavorito }}
                className="h-12 w-12 items-center justify-center rounded-full border border-borde"
              >
                <Ionicons name={esFavorito ? 'star' : 'star-outline'} size={24} color={esFavorito ? '#F5A524' : c.secundario} />
              </Tocable>
            </View>

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
                    <Text className="font-nunito8 text-sm text-enlace">
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

            {/* Votos: ¿el reporte coincide con lo que ve la gente? */}
            <View className="mt-3 flex-row flex-wrap items-center gap-2.5">
              <Text className="mr-1 font-nunito8 text-[15px] text-secundario">
                {reporte.es_propio ? t('community.votesOwn') : t('community.useful')}
              </Text>
              <BotonVoto
                icono={reporte.mi_voto === 1 ? 'thumbs-up' : 'thumbs-up-outline'}
                cantidad={reporte.votos_positivos ?? 0}
                activo={reporte.mi_voto === 1}
                color="#16A34A"
                deshabilitado={!!reporte.es_propio}
                etiqueta={t('community.voteUp', { count: reporte.votos_positivos ?? 0 })}
                onPress={() => onVotar(1)}
              />
              <BotonVoto
                icono={reporte.mi_voto === -1 ? 'thumbs-down' : 'thumbs-down-outline'}
                cantidad={reporte.votos_negativos ?? 0}
                activo={reporte.mi_voto === -1}
                color={c.peligro}
                deshabilitado={!!reporte.es_propio}
                etiqueta={t('community.voteDown', { count: reporte.votos_negativos ?? 0 })}
                onPress={() => onVotar(-1)}
              />
            </View>

            {errorComunidad ? (
              <View className="mt-3">
                <Aviso mensaje={errorComunidad} />
              </View>
            ) : null}

            {/* Comentarios: para actualizar o completar el reporte. */}
            <Text className="mb-2 mt-7 font-nunito9 text-lg text-texto">
              {t('community.comments')} {comentarios.length ? `(${comentarios.length})` : ''}
            </Text>
            {comentarios.length === 0 ? (
              <Text className="mb-3 font-nunito text-[15px] text-secundario">{t('community.noComments')}</Text>
            ) : (
              <View className="mb-3 gap-2">
                {comentarios.map((com) => (
                  <View key={com.id_comentario} className="rounded-[18px] border border-borde bg-tarjeta px-4 py-3">
                    <View className="flex-row items-center justify-between gap-2">
                      <Text className="font-nunito8 text-[13px] text-secundario">
                        {com.es_propio ? `${t('community.you')} · ` : ''}
                        {haceCuanto(com.fecha, t)}
                      </Text>
                      {com.puede_eliminar ? (
                        <Pressable
                          onPress={() => pedirBorrarComentario(com)}
                          accessibilityRole="button"
                          accessibilityLabel={t('community.deleteComment')}
                          hitSlop={10}
                          className="h-8 w-8 items-center justify-center"
                        >
                          <Ionicons name="trash-outline" size={18} color={c.secundario} />
                        </Pressable>
                      ) : null}
                    </View>
                    <Text className="mt-1 font-nunito text-base leading-6 text-texto">{com.contenido}</Text>
                  </View>
                ))}
              </View>
            )}
            {usuario ? (
              <>
                <View className="flex-row items-end gap-2">
                  <TextInput
                    value={nuevoComentario}
                    onChangeText={setNuevoComentario}
                    placeholder={t('community.commentPlaceholder')}
                    placeholderTextColor={c.secundario}
                    accessibilityLabel={t('community.commentPlaceholder')}
                    maxLength={280}
                    multiline
                    className="min-h-12 flex-1 rounded-2xl border-[1.5px] border-borde bg-superficie px-4 py-3 font-nunito text-base text-texto"
                  />
                  <Tocable
                    onPress={onComentar}
                    disabled={!nuevoComentario.trim() || comentando}
                    accessibilityLabel={t('community.send')}
                    className={`h-12 w-12 items-center justify-center rounded-full bg-boton ${!nuevoComentario.trim() || comentando ? 'opacity-50' : ''}`}
                  >
                    {comentando ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="send" size={20} color="#FFFFFF" />}
                  </Tocable>
                </View>
                {errorComentario ? (
                  <Text className="mt-2 font-nunito text-[15px] text-peligro" accessibilityLiveRegion="polite">
                    {errorComentario}
                  </Text>
                ) : null}
              </>
            ) : (
              <Pressable onPress={() => router.push('/login')} accessibilityRole="button" className="min-h-11 justify-center self-start">
                <Text className="font-nunito8 text-[15px] text-enlace">{t('community.loginToComment')}</Text>
              </Pressable>
            )}

            <View className="flex-1 justify-end gap-2.5 pt-8">
              {reporte.puede_eliminar ? (
                <Boton titulo={t('reportDetails.delete')} variante="peligro" icono="trash-outline" onPress={pedirEliminar} />
              ) : null}
              {/* No tiene sentido denunciar un reporte propio. */}
              {!reporte.es_propio ? (
                <Boton titulo={t('reportDetails.report')} variante="peligro" icono="flag-outline" onPress={pedirDenuncia} />
              ) : null}
            </View>
          </ScrollView>
        ) : error ? (
          <EstadoVacio
            icono="cloud-offline-outline"
            titulo={t('reportDetails.errorTitle')}
            detalle={t('common.checkConnection')}
            accion={t('common.retry')}
            onAccion={() => setIntento((i) => i + 1)}
          />
        ) : (
          <EstadoVacio icono="document-outline" titulo={t('reportDetails.notFound')} />
        )}
      </KeyboardAvoidingView>

      <HojaInferior visible={hojaDenuncia !== 'cerrada'} onCerrar={cerrarDenuncia} etiquetaCerrar={t('reportDetails.close')}>
        {hojaDenuncia === 'enviada' ? (
          <View className="items-center pb-2">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: '#16A34A1F' }}>
              <Ionicons name="checkmark" size={34} color="#16A34A" />
            </View>
            <Text className="text-center font-nunito9 text-[22px] text-texto">{t('reportDetails.reportSentTitle')}</Text>
            <Text className="mb-6 mt-1 text-center font-nunito text-base text-secundario">{t('reportDetails.reportThanks')}</Text>
            <View className="self-stretch">
              <Boton titulo={t('reportDetails.close')} onPress={cerrarDenuncia} />
            </View>
          </View>
        ) : (
          <>
            <Text className="font-nunito9 text-[22px] text-texto">{t('reportDetails.reportTitle')}</Text>
            <Text className="mb-5 mt-1 font-nunito text-[15px] text-secundario">{t('reportDetails.reportHint')}</Text>
            {hojaDenuncia === 'enviando' ? (
              <View className="items-center py-8">
                <ActivityIndicator color={c.boton} />
                <Text className="mt-3 font-nunito text-secundario">{t('reportDetails.reportSending')}</Text>
              </View>
            ) : (
              <>
                <OpcionHoja
                  icono="alert-circle-outline"
                  color={c.peligro}
                  titulo={t('reportDetails.reasonFalse')}
                  detalle={t('reportDetails.reasonFalseHint')}
                  onPress={() => enviarDenuncia('Información falsa')}
                />
                <OpcionHoja
                  icono="hand-left-outline"
                  color="#F97316"
                  titulo={t('reportDetails.reasonOffensive')}
                  detalle={t('reportDetails.reasonOffensiveHint')}
                  onPress={() => enviarDenuncia('Ofensivo o spam')}
                />
                {errorDenuncia ? (
                  <Text className="mb-2 font-nunito text-[15px] text-peligro" accessibilityLiveRegion="polite">
                    {t('reportDetails.reportError')}: {errorDenuncia}
                  </Text>
                ) : null}
                <View className="h-1.5" />
                <Boton titulo={t('reportDetails.cancel')} variante="neutro" onPress={cerrarDenuncia} />
              </>
            )}
          </>
        )}
      </HojaInferior>

      <HojaInferior visible={!!comentarioABorrar} onCerrar={() => setComentarioABorrar(null)} etiquetaCerrar={t('reportDetails.close')}>
        <Text className="font-nunito9 text-[22px] text-texto">{t('community.deleteCommentTitle')}</Text>
        <Text className="mb-6 mt-1 font-nunito text-base text-secundario" numberOfLines={3}>
          “{comentarioABorrar?.contenido}”
        </Text>
        <Boton
          titulo={t('reportDetails.deleteConfirm')}
          variante="peligro"
          icono="trash-outline"
          onPress={() => comentarioABorrar && borrarComentario(comentarioABorrar)}
        />
        <View className="h-2.5" />
        <Boton titulo={t('reportDetails.cancel')} variante="neutro" onPress={() => setComentarioABorrar(null)} />
      </HojaInferior>

      <HojaInferior visible={hojaEliminar} onCerrar={() => setHojaEliminar(false)} etiquetaCerrar={t('reportDetails.close')}>
        <View className="mb-4 h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: c.peligro + '1F' }}>
          <Ionicons name="trash-outline" size={26} color={c.peligro} />
        </View>
        <Text className="font-nunito9 text-[22px] text-texto">{t('reportDetails.deleteTitle')}</Text>
        <Text className="mb-6 mt-1 font-nunito text-base text-secundario">
          {reporte?.es_propio ? t('reportDetails.deleteHintOwn') : t('reportDetails.deleteHintAdmin')}
        </Text>
        {errorEliminar ? (
          <Text className="mb-3 font-nunito text-[15px] text-peligro" accessibilityLiveRegion="polite">
            {t('reportDetails.deleteError')}: {errorEliminar}
          </Text>
        ) : null}
        <Pressable
          onPress={confirmarEliminar}
          disabled={eliminando}
          accessibilityRole="button"
          className={`min-h-14 flex-row items-center justify-center gap-2 rounded-[18px] bg-peligro ${eliminando ? 'opacity-60' : ''}`}
        >
          {eliminando ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="trash-outline" size={20} color="#FFFFFF" />}
          <Text className="font-nunito8 text-base text-white">{t('reportDetails.deleteConfirm')}</Text>
        </Pressable>
        <View className="h-2.5" />
        <Boton titulo={t('reportDetails.cancel')} variante="neutro" onPress={() => setHojaEliminar(false)} />
      </HojaInferior>
    </View>
  );
}

// Botón de voto: ícono + cantidad. Relleno con su color cuando es el voto propio.
function BotonVoto({
  icono,
  cantidad,
  activo,
  color,
  deshabilitado,
  etiqueta,
  onPress,
}: {
  icono: IconName;
  cantidad: number;
  activo: boolean;
  color: string;
  deshabilitado: boolean;
  etiqueta: string;
  onPress: () => void;
}) {
  const c = useColores();
  return (
    <Tocable
      onPress={onPress}
      disabled={deshabilitado}
      accessibilityLabel={etiqueta}
      accessibilityState={{ selected: activo, disabled: deshabilitado }}
      className="min-h-11 flex-row items-center gap-1.5 rounded-full border-[1.5px] px-4"
      style={{ borderColor: activo ? color : c.borde, backgroundColor: activo ? color + '1F' : 'transparent', opacity: deshabilitado ? 0.6 : 1 }}
    >
      <Ionicons name={icono} size={18} color={activo ? color : c.secundario} />
      <Text className="font-nunito8 text-[15px]" style={{ color: activo ? color : c.texto }}>
        {cantidad}
      </Text>
    </Tocable>
  );
}
