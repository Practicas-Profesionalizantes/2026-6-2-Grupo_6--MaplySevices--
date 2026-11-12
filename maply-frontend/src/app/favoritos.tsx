import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Encabezado, EstadoVacio, ICONOS_LUGAR } from '@/components/ui';
import { textoEstado, useColores } from '@/constants/Colors';
import { cambiarFavorito, getEstadoActualLugar, getFavoritos, type Lugar } from '@/services/api';

type Favorito = Lugar & { estado: string | null };

// Lugares guardados con su estado de la última hora. Cuando alguien
// reporta en uno de ellos, llega una notificación.
export default function FavoritosScreen() {
  const { t } = useTranslation();
  const c = useColores();
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [intento, setIntento] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      setLoading(true);
      setError(false);
      getFavoritos()
        // ponytail: un pedido de estado por lugar; si las listas crecen, sumar el estado a GET /favoritos.
        .then((lista) =>
          Promise.all(
            lista.map((l) =>
              getEstadoActualLugar(l.id_lugar)
                .then((e) => ({ ...l, estado: e.estado }))
                .catch(() => ({ ...l, estado: null }))
            )
          )
        )
        .then((lista) => activo && setFavoritos(lista))
        .catch(() => activo && setError(true))
        .finally(() => activo && setLoading(false));
      return () => {
        activo = false;
      };
    }, [intento])
  );

  function quitar(lugar: Favorito) {
    setFavoritos((lista) => lista.filter((l) => l.id_lugar !== lugar.id_lugar));
    cambiarFavorito(lugar.id_lugar, false).catch(() => setIntento((i) => i + 1));
  }

  function reportar(lugar: Favorito) {
    router.push({
      pathname: '/create-report',
      params: { id_lugar: String(lugar.id_lugar), nombre: lugar.nombre, categoria: lugar.categoria },
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-fondo px-5 pt-4">
      <Encabezado titulo={t('community.myFavorites')} label={t('reportDetails.back')} />
      {loading ? (
        <ActivityIndicator color={c.boton} />
      ) : error ? (
        <EstadoVacio
          icono="cloud-offline-outline"
          titulo={t('community.favoritesError')}
          detalle={t('common.checkConnection')}
          accion={t('common.retry')}
          onAccion={() => setIntento((i) => i + 1)}
        />
      ) : (
        <FlatList
          data={favoritos}
          keyExtractor={(l) => String(l.id_lugar)}
          ItemSeparatorComponent={() => <View className="h-2.5" />}
          ListEmptyComponent={<EstadoVacio icono="star-outline" titulo={t('community.noFavorites')} detalle={t('community.noFavoritesHint')} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View className="rounded-[20px] border border-borde bg-tarjeta p-4">
              <View className="flex-row items-center gap-4">
                <View className="h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: c.boton + '1F' }}>
                  <Ionicons name={ICONOS_LUGAR[item.categoria] ?? 'location-outline'} size={24} color={c.boton} />
                </View>
                <View className="flex-1">
                  <Text className="font-nunito8 text-[17px] text-texto" numberOfLines={1}>
                    {item.nombre}
                  </Text>
                  <Text
                    className="font-nunito8 text-sm"
                    style={{ color: item.estado ? textoEstado(item.estado, c.oscuro) : c.secundario }}
                  >
                    {item.estado ? t(`createReport.categorias.${item.estado}`, item.estado) : t('community.noRecentReports')}
                  </Text>
                </View>
                <Pressable
                  onPress={() => quitar(item)}
                  accessibilityRole="button"
                  accessibilityLabel={t('community.unsave')}
                  hitSlop={6}
                  className="h-11 w-11 items-center justify-center"
                >
                  <Ionicons name="star" size={24} color="#F5A524" />
                </Pressable>
              </View>
              <Pressable onPress={() => reportar(item)} accessibilityRole="button" className="mt-2 min-h-11 flex-row items-center gap-1.5 self-start">
                <Ionicons name="add-circle-outline" size={18} color={c.enlace} />
                <Text className="font-nunito8 text-[15px] text-enlace">{t('community.reportHere')}</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
