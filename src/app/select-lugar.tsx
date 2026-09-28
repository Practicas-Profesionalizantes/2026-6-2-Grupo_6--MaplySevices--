import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Encabezado, ICONOS_LUGAR } from '@/components/ui';
import { useColores } from '@/constants/Colors';
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
  const c = useColores();
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [categoria, setCategoria] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [busquedaDebounced, setBusquedaDebounced] = useState('');
  const [loading, setLoading] = useState(true);
  const [foco, setFoco] = useState(false);

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

  const chip = (valor: string | null, texto: string) => {
    const activo = categoria === valor;
    return (
      <Pressable
        key={valor ?? 'todos'}
        onPress={() => setCategoria(valor)}
        accessibilityRole="button"
        accessibilityState={{ selected: activo }}
        hitSlop={{ top: 3, bottom: 3 }}
        className={`h-[38px] justify-center rounded-[19px] px-4 ${activo ? 'bg-texto' : 'border border-borde bg-superficie'}`}
      >
        <Text className={`font-nunito8 text-[15px] ${activo ? 'text-fondo' : 'text-texto'}`}>{texto}</Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-fondo px-5 pt-4">
      <Encabezado titulo={t('selectLugar.title')} label={t('reportDetails.back')} />

      <View
        className={`mb-4 min-h-14 flex-row items-center gap-3 rounded-2xl border-[1.5px] bg-superficie px-4 ${foco ? 'border-boton' : 'border-borde'}`}
      >
        <Ionicons name="search" size={22} color={c.secundario} />
        <TextInput
          value={busqueda}
          onChangeText={setBusqueda}
          onFocus={() => setFoco(true)}
          onBlur={() => setFoco(false)}
          placeholder={t('selectLugar.searchPlaceholder')}
          placeholderTextColor={c.secundario}
          accessibilityLabel={t('selectLugar.searchPlaceholder')}
          className="min-h-14 flex-1 font-nunito6 text-[17px] text-texto"
        />
      </View>

      <View className="mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 py-1">
          {chip(null, t('selectLugar.all'))}
          {CATEGORIAS_LUGAR.map((cat) => chip(cat, t(`selectLugar.categorias.${cat}`)))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator color={c.boton} />
      ) : lugares.length === 0 ? (
        <Text className="font-nunito text-base text-secundario">{t('selectLugar.empty')}</Text>
      ) : (
        <View className="flex-shrink overflow-hidden rounded-[20px] border border-borde bg-tarjeta">
          <FlatList
            data={lugares}
            keyExtractor={(item) => String(item.id_lugar)}
            ItemSeparatorComponent={() => <View className="h-px bg-borde" />}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onSeleccionar(item)}
                accessibilityRole="button"
                className="min-h-[72px] flex-row items-center gap-4 px-4 py-3"
              >
                <View className="h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: c.boton + '1F' }}>
                  <Ionicons name={ICONOS_LUGAR[item.categoria] ?? 'location-outline'} size={24} color={c.boton} />
                </View>
                <View className="flex-1">
                  <Text className="font-nunito8 text-[17px] text-texto" numberOfLines={1}>
                    {item.nombre}
                  </Text>
                  <Text className="font-nunito text-[15px] text-secundario" numberOfLines={1}>
                    {item.direccion || t(`selectLugar.categorias.${item.categoria}`, item.categoria)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={c.secundario} />
              </Pressable>
            )}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
