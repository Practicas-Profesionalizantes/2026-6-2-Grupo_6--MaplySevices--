import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import i18n from '@/constants/i18n';
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
    day: 'numeric',
  });
}

export default function ConfiguracionScreen() {
  const { t, i18n: i18nInstance } = useTranslation();
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
    <SafeAreaView className="flex-1 bg-maply-bg px-5 pt-4">
      <Text className="mb-2 text-sm font-semibold text-maply-muted">{t('config.language')}</Text>
      <View className="mb-6 flex-row gap-2">
        {IDIOMAS.map((opcion) => (
          <Pressable
            key={opcion.codigo}
            onPress={() => onCambiarIdioma(opcion.codigo)}
            className={`rounded-full px-4 py-2 ${idioma === opcion.codigo ? 'bg-maply-azul' : 'bg-white border border-maply-card-border'}`}
          >
            <Text className="text-sm font-semibold text-maply-ink">{opcion.etiqueta}</Text>
          </Pressable>
        ))}
      </View>

      {usuario ? (
        <View className="rounded-2xl border border-maply-card-border bg-white p-4">
          <Text className="text-base font-semibold text-maply-ink">{usuario.nombre}</Text>
          <Text className="mt-1 text-sm text-maply-muted">{usuario.email}</Text>
          {miembroDesde ? (
            <Text className="mt-2 text-xs text-maply-muted">
              {t('config.memberSince', { fecha: miembroDesde })}
            </Text>
          ) : null}
        </View>
      ) : (
        <Text className="text-maply-muted">{t('config.notLoggedIn')}</Text>
      )}

      <Link href="/legal" className="mt-6 text-sm font-semibold text-maply-violeta underline">
        {t('legal.linkText')}
      </Link>

      {usuario ? (
        <View className="mt-8">
          {!borrando ? (
            <Pressable onPress={() => setBorrando(true)} accessibilityRole="button">
              <Text className="text-sm font-semibold text-red-600">{t('config.deleteAccount')}</Text>
            </Pressable>
          ) : (
            <View className="rounded-2xl border border-red-300 bg-white p-4">
              <Text className="mb-2 text-sm text-maply-ink">{t('config.deletePassword')}</Text>
              <TextInput
                value={contrasena}
                onChangeText={setContrasena}
                secureTextEntry
                accessibilityLabel={t('auth.password')}
                className="mb-3 rounded-xl border border-maply-card-border p-3 text-maply-ink"
              />
              <View className="flex-row gap-3">
                <Pressable onPress={() => { setBorrando(false); setContrasena(''); }} className="rounded-full border border-maply-card-border px-4 py-2">
                  <Text className="text-sm text-maply-ink">{t('auth.cancel')}</Text>
                </Pressable>
                <Pressable disabled={enviando || !contrasena} onPress={onBorrarCuenta} className="rounded-full bg-red-600 px-4 py-2">
                  <Text className="text-sm font-semibold text-white">{t('config.deleteConfirm')}</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      ) : null}
    </SafeAreaView>
  );
}
