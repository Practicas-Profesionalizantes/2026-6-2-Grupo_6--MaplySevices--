import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Boton, Campo, Encabezado } from '@/components/ui';
import { olvideContrasena, restablecerContrasena } from '@/services/api';

// Dos pasos en la misma pantalla: 1) pedir el código por mail, 2) canjearlo
// por una contraseña nueva.
export default function OlvideContrasenaScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function enviar(accion: () => Promise<{ mensaje: string }>, alTerminar: () => void) {
    setEnviando(true);
    try {
      const { mensaje } = await accion();
      Alert.alert(mensaje);
      alTerminar();
    } catch (e: any) {
      Alert.alert(t('auth.forgotErrorTitle'), e.message);
    } finally {
      setEnviando(false);
    }
  }

  function onPedirCodigo() {
    if (!email.trim()) return;
    enviar(() => olvideContrasena(email.trim()), () => setCodigoEnviado(true));
  }

  function onCambiar() {
    if (codigo.trim().length !== 6 || !contrasena) return;
    enviar(
      () => restablecerContrasena({ email: email.trim(), codigo: codigo.trim(), contrasena }),
      () => router.replace('/login')
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-fondo">
      <KeyboardAvoidingView behavior="padding" className="flex-1">
      <ScrollView contentContainerClassName="px-5 pt-4 pb-4" keyboardShouldPersistTaps="handled">
        <Encabezado titulo={t('auth.forgotTitle')} label={t('reportDetails.back')} />
        <Text className="mb-6 font-nunito text-base text-secundario">{t('auth.forgotIntro')}</Text>

        <Campo
          etiqueta={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          editable={!codigoEnviado}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder={t('placeholders.email')}
        />

        {codigoEnviado ? (
          <>
            <Text className="mb-4 rounded-2xl border border-borde bg-tarjeta p-4 font-nunito text-[15px] leading-5 text-texto">
              {t('auth.codeHint')}
            </Text>

            <Campo
              etiqueta={t('auth.code')}
              value={codigo}
              onChangeText={setCodigo}
              keyboardType="number-pad"
              maxLength={6}
              autoComplete="one-time-code"
              placeholder="123456"
            />

            <Campo
              etiqueta={t('auth.newPassword')}
              value={contrasena}
              onChangeText={setContrasena}
              secreto
              etiquetaMostrar={t('auth.showPassword')}
              autoComplete="new-password"
              placeholder="••••••••"
              className="mb-1"
            />
            <Text className="mb-6 font-nunito text-sm text-secundario">{t('auth.passwordHint')}</Text>

            <Boton titulo={t('auth.resetSubmit')} cargando={enviando} onPress={onCambiar} />

            <Pressable disabled={enviando} onPress={onPedirCodigo} accessibilityRole="button" className="mt-2 min-h-12 items-center justify-center">
              <Text className="font-nunito8 text-base text-boton">{t('auth.resendCode')}</Text>
            </Pressable>
          </>
        ) : (
          <Boton titulo={t('auth.sendCode')} cargando={enviando} onPress={onPedirCodigo} />
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
