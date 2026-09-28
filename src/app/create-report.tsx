import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View, Alert, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Boton, Campo, Encabezado, Tocable } from '@/components/ui';
import { colorEstado, fondoEstado, textoEstado, useColores } from '@/constants/Colors';
import { crearReporte, getUsuarioActual, type Lugar } from '@/services/api';
import { CATEGORIAS_REPORTE, type CategoriaReporte } from '@/constants/categoriasReporte';
import { pedirSeleccionDeLugar } from '@/state/lugarSeleccionado';

export default function CreateReportScreen() {
  const { t } = useTranslation();
  const c = useColores();
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
    <SafeAreaView className="flex-1 bg-fondo">
      <KeyboardAvoidingView behavior="padding" className="flex-1">
      <ScrollView contentContainerClassName="px-5 pt-4 pb-4" keyboardShouldPersistTaps="handled">
        <Encabezado titulo={t('createReport.title')} cerrar label={t('createReport.close')} />

        <Text className="mb-2 font-nunito8 text-[15px] text-secundario">{t('createReport.place')}</Text>
        <Pressable
          onPress={onElegirLugar}
          accessibilityRole="button"
          className="mb-5 min-h-[76px] flex-row items-center gap-4 rounded-[20px] border border-borde bg-tarjeta p-4"
        >
          <View className="h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: c.boton + '1F' }}>
            <Ionicons name="location-outline" size={24} color={c.boton} />
          </View>
          <View className="flex-1">
            <Text className={`font-nunito8 text-[17px] ${lugar ? 'text-texto' : 'text-secundario'}`} numberOfLines={1}>
              {lugar ? lugar.nombre : t('createReport.choosePlace')}
            </Text>
            {lugar?.direccion ? (
              <Text className="font-nunito text-[15px] text-secundario" numberOfLines={1}>
                {lugar.direccion}
              </Text>
            ) : null}
          </View>
          {lugar ? <Text className="font-nunito8 text-base text-boton">{t('createReport.change')}</Text> : null}
          {!lugar ? <Ionicons name="chevron-forward" size={20} color={c.secundario} /> : null}
        </Pressable>

        <Text className="mb-2 font-nunito8 text-[15px] text-secundario">{t('createReport.category')}</Text>
        <View className="mb-5 flex-row flex-wrap justify-between gap-y-2.5">
          {CATEGORIAS_REPORTE.map((cat) => {
            const elegida = categoria === cat;
            return (
              <Tocable
                key={cat}
                onPress={() => setCategoria(cat)}
                accessibilityRole="radio"
                accessibilityState={{ selected: elegida }}
                exterior={{ width: '48.5%' }}
                className="min-h-14 flex-row items-center gap-3 rounded-2xl border-[1.5px] px-4"
                style={{
                  borderColor: elegida ? colorEstado(cat) : c.borde,
                  backgroundColor: elegida ? fondoEstado(cat) : c.tarjeta,
                }}
              >
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colorEstado(cat) }} />
                <Text
                  className="flex-1 font-nunito8 text-[15px]"
                  style={{ color: elegida ? textoEstado(cat, c.oscuro) : c.texto }}
                  numberOfLines={2}
                >
                  {t(`createReport.categorias.${cat}`)}
                </Text>
                {elegida ? <Ionicons name="checkmark" size={20} color={colorEstado(cat)} /> : null}
              </Tocable>
            );
          })}
        </View>

        <Campo
          etiqueta={t('createReport.content')}
          opcional={t('createReport.optional')}
          value={contenido}
          onChangeText={setContenido}
          multiline
          placeholder={t('placeholders.reportContent')}
        />
      </ScrollView>

      <View className="px-5 pb-4 pt-2">
        <Boton titulo={t('createReport.submit')} cargando={enviando} onPress={onSubmit} />
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
