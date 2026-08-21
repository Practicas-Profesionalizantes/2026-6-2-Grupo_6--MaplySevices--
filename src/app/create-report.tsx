import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { crearReporte, getUsuarioActual, type Lugar } from '@/services/api';
import { CATEGORIAS_REPORTE, type CategoriaReporte } from '@/constants/categoriasReporte';
import { pedirSeleccionDeLugar } from '@/state/lugarSeleccionado';

export default function CreateReportScreen() {
  const { t } = useTranslation();
  const [categoria, setCategoria] = useState<CategoriaReporte>('otro');
  const [contenido, setContenido] = useState('');
  const [lugar, setLugar] = useState<Lugar | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    // Guarda extra: si alguien entra a esta pantalla directamente sin
    // pasar por el botón de "+ New report" de la home (que ya redirige a
    // login si hace falta), igual la mandamos a loguearse en vez de dejar
    // que el POST falle con un 401 confuso.
    getUsuarioActual().then((usuario) => {
      if (!usuario) router.replace('/login');
    });
  }, []);

  function onElegirLugar() {
    pedirSeleccionDeLugar(setLugar);
    router.push('/select-lugar');
  }

  async function onSubmit() {
    if (!lugar) {
      Alert.alert(t('createReport.errorTitle'), t('createReport.lugarRequerido'));
      return;
    }
    setEnviando(true);
    try {
      // El texto libre es opcional: si no escribió nada, se manda la
      // etiqueta de la categoría elegida como contenido (la columna es
      // NOT NULL en la base, y de paso el reporte igual queda legible).
      const contenidoFinal = contenido.trim() || t(`createReport.categorias.${categoria}`);
      await crearReporte({ id_lugar: lugar.id_lugar, contenido: contenidoFinal, categoria_reporte: categoria });
      router.back();
    } catch (e: any) {
      Alert.alert(t('createReport.errorTitle'), e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-maply-bg px-5 pt-4">
      <Text className="mb-2 text-sm font-semibold text-maply-muted">{t('createReport.place')}</Text>
      <Pressable
        onPress={onElegirLugar}
        className="mb-4 rounded-2xl border border-maply-card-border bg-white p-3"
      >
        <Text className={lugar ? 'text-maply-ink' : 'text-maply-muted'}>
          {lugar ? lugar.nombre : t('createReport.choosePlace')}
        </Text>
      </Pressable>

      <Text className="mb-2 text-sm font-semibold text-maply-muted">{t('createReport.category')}</Text>
      <View className="mb-4 flex-row flex-wrap gap-2">
        {CATEGORIAS_REPORTE.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setCategoria(cat)}
            className={`rounded-full px-4 py-2 ${categoria === cat ? 'bg-maply-azul' : 'bg-white border border-maply-card-border'}`}
          >
            <Text className="text-maply-ink">{t(`createReport.categorias.${cat}`)}</Text>
          </Pressable>
        ))}
      </View>

      <Text className="mb-2 text-sm font-semibold text-maply-muted">
        {t('createReport.content')} ({t('createReport.optional')})
      </Text>
      <TextInput
        value={contenido}
        onChangeText={setContenido}
        multiline
        placeholder="Ej: mucha fila, cerrado, demora..."
        className="mb-4 h-28 rounded-2xl border border-maply-card-border bg-white p-3 text-maply-ink"
      />

      <Pressable
        disabled={enviando}
        onPress={onSubmit}
        className="items-center rounded-full bg-maply-violeta px-4 py-3"
      >
        <Text className="font-semibold text-white">{t('createReport.submit')}</Text>
      </Pressable>
    </SafeAreaView>
  );
}
