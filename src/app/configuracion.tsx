import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import i18n from '@/constants/i18n';
import { getUsuarioActual, type Usuario } from '@/services/api';

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
    </SafeAreaView>
  );
}
