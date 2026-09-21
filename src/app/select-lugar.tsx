import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { getLugares, type Lugar } from '@/services/api';
import { CATEGORIAS_LUGAR } from '@/constants/categoriasLugar';
import { resolverSeleccionDeLugar } from '@/state/lugarSeleccionado';

// Debounce del buscador (SCRUM-257): sin esto, cada letra tipeada dispara
// un request al backend (y, más adelante, a la Search Box de Mapbox si se
// integra acá — que factura por cada tecla sin debounce). 400ms es un
// punto medio razonable: se siente instantáneo para quien escribe, pero
// no manda un request por letra.
const DEBOUNCE_MS = 400;

export default function SelectLugarScreen() {
  const { t } = useTranslation();
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [categoria, setCategoria] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [busquedaDebounced, setBusquedaDebounced] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setBusquedaDebounced(busqueda.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [busqueda]);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      setLoading(true);
      getLugares(categoria ?? undefined, busquedaDebounced || undefined)
        .then((data) => activo && setLugares(data))
        .finally(() => activo && setLoading(false));
      return () => {
        activo = false;
      };
    }, [categoria, busquedaDebounced])
  );

  function onSeleccionar(lugar: Lugar) {
    resolverSeleccionDeLugar(lugar);
    router.back();
  }

  return (
    <SafeAreaView className="flex-1 bg-maply-bg px-5 pt-4">
      <TextInput
        value={busqueda}
        onChangeText={setBusqueda}
        placeholder={t('selectLugar.searchPlaceholder')}
        className="mb-3 rounded-2xl border border-maply-card-border bg-white p-3 text-maply-ink"
      />

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
