import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { clamp, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { MapaMaply, type LugarPin, type MapaMaplyHandle } from '@/components/MapaMaply';
import { ReportCard } from '@/components/ReportCard';
import { Boton, BotonRedondo, Tocable, sombraSuave } from '@/components/ui';
import { useColores } from '@/constants/Colors';
import { bienvenidaVista, getReportes, getUsuarioActual, logout, type Reporte, type Usuario } from '@/services/api';
import { useUbicacionActual } from '@/hooks/use-ubicacion';

// La primera vez se muestra la bienvenida; después, directo al mapa.
export default function IndexScreen() {
  const [vista, setVista] = useState<boolean | null>(null);
  useEffect(() => {
    bienvenidaVista().then(setVista);
  }, []);
  if (vista === null) return null;
  if (!vista) return <Redirect href="/bienvenida" />;
  return <HomeScreen />;
}

function HomeScreen() {
  const { t } = useTranslation();
  const c = useColores();
  const insets = useSafeAreaInsets();
  const { height: alto } = useWindowDimensions();
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [elegidoId, setElegidoId] = useState<number | null>(null);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const mapaRef = useRef<MapaMaplyHandle>(null);
  const { ubicacion } = useUbicacionActual();

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

  // Apenas tenemos la ubicación real del usuario (puede tardar un toque en
  // llegar, o nunca llegar si no dio permiso), centramos el mapa ahí en vez
  // de dejarlo siempre en el centro fijo de CABA.
  useEffect(() => {
    if (ubicacion) {
      mapaRef.current?.centrarEn(ubicacion.latitud, ubicacion.longitud);
    }
  }, [ubicacion]);

  // Un pin por lugar (el reporte más nuevo, la lista viene ordenada por
  // fecha), solo si el lugar tiene lat/lng: si algún lugar viejo quedó sin
  // coordenadas no rompemos el mapa, solo no le ponemos pin.
  const pines = useMemo<LugarPin[]>(() => {
    const vistos = new Set<number>();
    return reportes
      .filter((r) => r.lugar?.latitud && r.lugar?.longitud && !vistos.has(r.id_lugar) && vistos.add(r.id_lugar))
      .map((r) => ({
        id: r.id_reporte,
        nombre: r.lugar!.nombre,
        latitud: Number(r.lugar!.latitud),
        longitud: Number(r.lugar!.longitud),
        categoria: r.categoria_reporte,
        etiqueta: `${r.lugar!.nombre} · ${t(`createReport.categorias.${r.categoria_reporte}`)}`,
      }));
  }, [reportes, t]);

  // Hoja inferior: se arrastra desde la manija/título entre 40 % y 85 %.
  const minimo = alto * 0.4;
  const maximo = alto * 0.85;
  const altura = useSharedValue(minimo);
  const inicio = useSharedValue(0);
  const arrastre = Gesture.Pan()
    .onStart(() => {
      inicio.value = altura.value;
    })
    .onUpdate((e) => {
      altura.value = clamp(inicio.value - e.translationY, minimo, maximo);
    })
    .onEnd((e) => {
      const destino = altura.value - e.velocityY * 0.15 > (minimo + maximo) / 2 ? maximo : minimo;
      altura.value = withSpring(destino, { damping: 20, stiffness: 180 });
    });
  const estiloHoja = useAnimatedStyle(() => ({ height: altura.value }));
  // Acompaña a la hoja al bajar, pero no sube más del 40 %: arriba la hoja lo tapa.
  const estiloUbicacion = useAnimatedStyle(() => ({ bottom: Math.min(altura.value, minimo) + 16 }));

  function onNuevoReportePress() {
    router.push(usuario ? '/create-report' : '/login');
  }

  function abrirReporte(id: number) {
    setElegidoId(id);
    router.push(`/report-details?id=${id}`);
  }

  async function onLogoutConfirm() {
    setCerrandoSesion(false);
    await logout();
    setUsuario(null);
    // Al salir se vuelve a la bienvenida (desde ahí se entra de nuevo o se sigue sin cuenta).
    router.replace('/bienvenida');
  }

  return (
    <View className="flex-1 bg-fondo">
      <MapaMaply
        ref={mapaRef}
        pines={pines}
        elegidoId={elegidoId}
        onPinPress={(lugar) => abrirReporte(lugar.id)}
        mostrarUbicacion={!!ubicacion}
        margenOrnamentos={insets.top + 72}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Barra flotante: logo, configuración y sesión (mismas acciones que antes). */}
      <View
        className="absolute left-0 right-0 flex-row items-center justify-between px-4"
        style={{ top: insets.top + 8 }}
      >
        <View className="rounded-[14px] bg-superficie" style={sombraSuave}>
          <Image
            source={require('@/assets/images/logo.png')}
            accessibilityLabel="Maply"
            style={{ width: 48, height: 48, borderRadius: 14 }}
          />
        </View>
        <View className="flex-row items-center gap-2">
          <BotonRedondo
            icono="settings-outline"
            onPress={() => router.push('/configuracion')}
            accessibilityLabel={t('home.settings')}
          />
          <Tocable
            onPress={usuario ? () => setCerrandoSesion(true) : () => router.push('/login')}
            className="h-12 flex-row items-center gap-2 rounded-full border border-borde bg-superficie pl-1.5 pr-4"
            style={sombraSuave}
          >
            {usuario ? (
              <>
                <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: c.boton + '26' }}>
                  <Text className="font-nunito9 text-base" style={{ color: c.boton }}>
                    {usuario.nombre.trim().charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text className="max-w-[110px] font-nunito8 text-base text-texto" numberOfLines={1}>
                  {usuario.nombre}
                </Text>
              </>
            ) : (
              <Text className="pl-2.5 font-nunito8 text-base text-texto">{t('auth.loginLink')}</Text>
            )}
          </Tocable>
        </View>
      </View>

      <Animated.View style={[{ position: 'absolute', right: 16 }, estiloUbicacion]}>
        <BotonRedondo
          icono="navigate-outline"
          onPress={() => ubicacion && mapaRef.current?.centrarEn(ubicacion.latitud, ubicacion.longitud)}
          accessibilityLabel={t('home.myLocation')}
        />
      </Animated.View>

      {/* Reanimated no toma className: la hoja va con style. */}
      <Animated.View
        style={[
          estiloHoja,
          { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: c.superficie },
          { shadowColor: '#0E1330', shadowOpacity: 0.12, shadowRadius: 20, elevation: 12 },
        ]}
      >
        <GestureDetector gesture={arrastre}>
          <View className="px-5 pb-3">
            <View className="items-center py-3">
              <View className="h-1.5 w-11 rounded-full bg-borde" />
            </View>
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1">
                <Text className="font-nunito9 text-[22px] text-texto">{t('home.subtitle')}</Text>
                <Text className="font-nunito text-sm text-secundario">{t('home.updated')}</Text>
              </View>
              <Tocable
                onPress={onNuevoReportePress}
                className="h-12 flex-row items-center gap-1.5 rounded-full bg-boton px-5"
                style={{ shadowColor: c.boton, shadowOpacity: 0.35, shadowRadius: 10, elevation: 4 }}
              >
                <Ionicons name="add" size={22} color="#FFFFFF" />
                <Text className="font-nunito8 text-base text-white">{t('home.newReport')}</Text>
              </Tocable>
            </View>
          </View>
        </GestureDetector>

        {loading ? (
          <ActivityIndicator color={c.boton} className="mt-4" />
        ) : error ? (
          <Text className="px-5 font-nunito text-base text-secundario">{error}</Text>
        ) : (
          <FlatList
            data={reportes}
            keyExtractor={(item) => String(item.id_reporte)}
            renderItem={({ item }) => (
              <Pressable onPress={() => abrirReporte(item.id_reporte)} accessibilityRole="button">
                <ReportCard reporte={item} />
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View className="h-2.5" />}
            ListEmptyComponent={<Text className="font-nunito text-base text-secundario">{t('home.empty')}</Text>}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}
          />
        )}
      </Animated.View>
      {usuario ? (
        <HojaCerrarSesion
          visible={cerrandoSesion}
          usuario={usuario}
          onCancelar={() => setCerrandoSesion(false)}
          onConfirmar={onLogoutConfirm}
        />
      ) : null}
    </View>
  );
}

// Confirmación de "cerrar sesión" con el estilo de la app (el Alert nativo
// de Android no se puede estilizar).
function HojaCerrarSesion({
  visible,
  usuario,
  onCancelar,
  onConfirmar,
}: {
  visible: boolean;
  usuario: Usuario;
  onCancelar: () => void;
  onConfirmar: () => void;
}) {
  const { t } = useTranslation();
  const c = useColores();
  const insets = useSafeAreaInsets();
  const sinMovimiento = useReducedMotion();
  return (
    <Modal
      visible={visible}
      transparent
      animationType={sinMovimiento ? 'none' : 'slide'}
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onCancelar}
    >
      <Pressable className="flex-1" style={{ backgroundColor: 'rgba(10,14,31,0.45)' }} onPress={onCancelar} accessibilityLabel={t('auth.cancel')} />
      <View
        className="rounded-t-[28px] px-5 pt-3"
        style={{ backgroundColor: c.superficie, paddingBottom: insets.bottom + 16 }}
      >
        <View className="mb-5 items-center">
          <View className="h-1.5 w-11 rounded-full bg-borde" />
        </View>
        <View className="mb-5 flex-row items-center gap-4">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-boton">
            <Text className="font-nunito9 text-xl text-white">{usuario.nombre.trim().charAt(0).toUpperCase()}</Text>
          </View>
          <View className="flex-1">
            <Text className="font-nunito8 text-[17px] text-texto" numberOfLines={1}>
              {usuario.nombre}
            </Text>
            <Text className="font-nunito text-[15px] text-secundario" numberOfLines={1}>
              {usuario.email}
            </Text>
          </View>
        </View>
        <Text className="font-nunito9 text-[22px] text-texto">{t('auth.logoutConfirmTitle')}</Text>
        <Text className="mb-6 mt-1 font-nunito text-base text-secundario">{t('auth.logoutHint')}</Text>
        <Boton titulo={t('auth.logout')} variante="peligro" icono="log-out-outline" onPress={onConfirmar} />
        <View className="h-2.5" />
        <Boton titulo={t('auth.cancel')} variante="neutro" onPress={onCancelar} />
      </View>
    </Modal>
  );
}
