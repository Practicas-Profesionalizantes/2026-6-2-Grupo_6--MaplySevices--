import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import i18n from '@/constants/i18n';
import { Boton, Campo, Encabezado } from '@/components/ui';
import { useColores } from '@/constants/Colors';
import { borrarCuenta, getUsuarioActual, type Usuario } from '@/services/api';

const IDIOMAS = [
  { codigo: 'es', etiqueta: 'Español' },
  { codigo: 'en', etiqueta: 'English' },
] as const;

function formatearFecha(fechaIso?: string): string | null {
  if (!fechaIso) return null;
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return null;
  return fecha.toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'es-AR', {
    year: 'numeric',
    month: 'long',
  });
}

export default function ConfiguracionScreen() {
  const { t, i18n: i18nInstance } = useTranslation();
  const c = useColores();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [idioma, setIdioma] = useState(i18nInstance.language);
  const [borrando, setBorrando] = useState(false);
  const [contrasena, setContrasena] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Alert.alert en web no muestra botones, así que se confirma con window.confirm.
  function confirmar(mensaje: string, onSi: () => void) {
    if (Platform.OS === 'web') {
      if (window.confirm(mensaje)) onSi();
      return;
    }
    Alert.alert(mensaje, undefined, [
      { text: t('auth.cancel'), style: 'cancel' },
      { text: t('config.deleteConfirm'), style: 'destructive', onPress: onSi },
    ]);
  }

  function onBorrarCuenta() {
    if (!contrasena) return;
    confirmar(t('config.deleteWarning'), async () => {
      setEnviando(true);
      try {
        await borrarCuenta(contrasena);
        router.replace('/');
      } catch (e: any) {
        Alert.alert(t('config.deleteError'), e.message);
      } finally {
        setEnviando(false);
      }
    });
  }

  useEffect(() => {
    getUsuarioActual().then(setUsuario);
  }, []);

  function onCambiarIdioma(codigo: string) {
    i18nInstance.changeLanguage(codigo);
    setIdioma(codigo);
  }

  const miembroDesde = formatearFecha(usuario?.fecha_registro);

  return (
    <SafeAreaView className="flex-1 bg-fondo">
      <ScrollView contentContainerClassName="px-5 pt-4 pb-4" contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <Encabezado titulo={t('config.title')} label={t('reportDetails.back')} />

        {usuario ? (
          <View className="flex-row items-center gap-4 rounded-[20px] border border-borde bg-tarjeta p-5">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-boton">
              <Text className="font-nunito9 text-2xl text-white">{usuario.nombre.trim().charAt(0).toUpperCase()}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-nunito9 text-[22px] text-texto" numberOfLines={1}>
                {usuario.nombre}
              </Text>
              <Text className="font-nunito text-base text-secundario" numberOfLines={1}>
                {usuario.email}
              </Text>
              {miembroDesde ? (
                <Text className="mt-0.5 font-nunito8 text-sm text-boton">{t('config.memberSince', { fecha: miembroDesde })}</Text>
              ) : null}
            </View>
          </View>
        ) : (
          <View className="rounded-[20px] border border-borde bg-tarjeta p-5">
            <Text className="font-nunito text-base text-secundario">{t('config.notLoggedIn')}</Text>
          </View>
        )}

        <Text className="mb-2 mt-6 font-nunito8 text-[15px] text-secundario">{t('config.language')}</Text>
        <View className="flex-row rounded-2xl bg-borde p-1" accessibilityRole="radiogroup">
          {IDIOMAS.map((opcion) => {
            const activo = idioma === opcion.codigo;
            return (
              <Pressable
                key={opcion.codigo}
                onPress={() => onCambiarIdioma(opcion.codigo)}
                accessibilityRole="radio"
                accessibilityState={{ selected: activo }}
                className={`min-h-12 flex-1 items-center justify-center rounded-xl ${activo ? 'bg-superficie' : ''}`}
                style={activo ? { shadowColor: '#0E1330', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 } : undefined}
              >
                <Text className={`font-nunito8 text-base ${activo ? 'text-texto' : 'text-secundario'}`}>{opcion.etiqueta}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={() => router.push('/legal')} accessibilityRole="link" className="mt-6">
          <View className="flex-row items-center gap-3 rounded-[20px] border border-borde bg-tarjeta px-5" style={{ minHeight: 64 }}>
            <Ionicons name="shield-outline" size={22} color={c.boton} />
            <Text className="flex-1 font-nunito8 text-[17px] text-texto">{t('config.privacy')}</Text>
            <Ionicons name="chevron-forward" size={20} color={c.secundario} />
          </View>
        </Pressable>

        {usuario ? (
          <View className="flex-1 justify-end pt-8">
            {!borrando ? (
              <Boton titulo={t('config.deleteAccount')} variante="peligro" onPress={() => setBorrando(true)} />
            ) : (
              <View className="rounded-[20px] border-[1.5px] border-[#E5484D66] bg-tarjeta p-4">
                <Text className="mb-3 font-nunito text-base text-texto">{t('config.deletePassword')}</Text>
                <Campo
                  etiqueta={t('auth.password')}
                  value={contrasena}
                  onChangeText={setContrasena}
                  secreto
                  etiquetaMostrar={t('auth.showPassword')}
                />
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Boton titulo={t('auth.cancel')} variante="neutro" onPress={() => { setBorrando(false); setContrasena(''); }} />
                  </View>
                  <Pressable
                    disabled={enviando || !contrasena}
                    onPress={onBorrarCuenta}
                    accessibilityRole="button"
                    className={`min-h-14 flex-1 items-center justify-center rounded-[18px] bg-peligro ${enviando || !contrasena ? 'opacity-50' : ''}`}
                  >
                    <Text className="font-nunito8 text-base text-white">{t('config.deleteConfirm')}</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
