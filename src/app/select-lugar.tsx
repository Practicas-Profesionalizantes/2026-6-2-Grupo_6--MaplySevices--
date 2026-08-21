import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { getLugares, type Lugar } from '@/services/api';
import { CATEGORIAS_LUGAR } from '@/constants/categoriasLugar';
import { resolverSeleccionDeLugar } from '@/state/lugarSeleccionado';

export default function SelectLugarScreen() {
  const { t } = useTranslation();
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [categoria, setCategoria] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      setLoading(true);
      getLugares(categoria ?? undefined)
        .then((data) => activo && setLugares(data))
        .finally(() => activo && setLoading(false));
      return () => {
        activo = false;
      };
    }, [categoria])
  );

  function onSeleccionar(lugar: Lugar) {
    resolverSeleccionDeLugar(lugar);
    router.back();
  }

  return (
    <SafeAreaView className="flex-1 bg-maply-bg px-5 pt-4">
      <View className="mb-3 flex-row flex-wrap gap-2">
        <Pressable
          onPress={() => setCategoria(null)}
          className={`rounded-full px-3 py-1.5 ${categoria === null ? 'bg-maply-azul' : 'bg-white border border-maply-card-border'}`}
        >
          <Text className="text-sm text-maply-ink">{t('selectLugar.all')}</Text>
        </Pressable>
        {CATEGORIAS_LUGAR.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setCategoria(cat)}
            className={`rounded-full px-3 py-1.5 ${categoria === cat ? 'bg-maply-azul' : 'bg-white border border-maply-card-border'}`}
          >
            <Text className="text-sm text-maply-ink">{t(`selectLugar.categorias.${cat}`)}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color="#8EC5FC" />
      ) : (
        <FlatList
          data={lugares}
          keyExtractor={(item) => String(item.id_lugar)}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onSeleccionar(item)}
              className="mb-3 rounded-2xl border border-maply-card-border bg-white p-4"
            >
              <Text className="text-base font-semibold text-maply-ink">{item.nombre}</Text>
              <Text className="mt-1 text-xs uppercase text-maply-muted">
                {t(`selectLugar.categorias.${item.categoria}`, item.categoria)}
              </Text>
              {item.direccion ? (
                <Text className="mt-1 text-sm text-maply-muted">{item.direccion}</Text>
              ) : null}
            </Pressable>
          )}
          ListEmptyComponent={<Text className="text-maply-muted">{t('selectLugar.empty')}</Text>}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
}
