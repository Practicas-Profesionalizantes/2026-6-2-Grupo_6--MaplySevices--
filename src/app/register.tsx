import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Boton, Campo, Encabezado } from '@/components/ui';
import { useColores } from '@/constants/Colors';
import { login, register } from '@/services/api';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const c = useColores();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [telefono, setTelefono] = useState('');
  const [acepta, setAcepta] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const letrasYNumeros = /[A-Za-z]/.test(contrasena) && /\d/.test(contrasena);
  const largoOk = contrasena.length >= 8;

  async function onSubmit() {
    if (!nombre.trim() || !email.trim() || !largoOk || !letrasYNumeros) {
      Alert.alert(t('auth.registerErrorTitle'), t('auth.registerValidation'));
      return;
    }
    if (!acepta) {
      Alert.alert(t('auth.registerErrorTitle'), t('legal.mustAccept'));
      return;
    }
    setEnviando(true);
    try {
      await register({
        nombre: nombre.trim(),
        email: email.trim(),
        contrasena,
        telefono: telefono.trim() || undefined,
        acepta_terminos: true,
      });
      // Después de registrar, logueamos directo con las mismas credenciales
      // para no hacerle escribir el email/contraseña dos veces seguidas.
      await login({ email: email.trim(), contrasena });
      router.replace('/');
    } catch (e: any) {
      Alert.alert(t('auth.registerErrorTitle'), e.message);
    } finally {
      setEnviando(false);
    }
  }

  // Requisito de contraseña en vivo: check verde cuando se cumple.
  const requisito = (ok: boolean, texto: string) => (
    <View className="flex-row items-center gap-1.5">
      <Ionicons name={ok ? 'checkmark' : 'ellipse-outline'} size={ok ? 18 : 14} color={ok ? '#16A34A' : c.secundario} />
      <Text className="font-nunito8 text-sm" style={{ color: ok ? (c.oscuro ? '#4ADE80' : '#15803D') : c.secundario }}>
        {texto}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-fondo">
      <KeyboardAvoidingView behavior="padding" className="flex-1">
      <ScrollView contentContainerClassName="px-5 pt-4 pb-4" contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <Encabezado label={t('reportDetails.back')} />
        <Text className="font-nunito9 text-[32px] leading-10 text-texto">{t('auth.registerTitle')}</Text>
        <Text className="mb-6 mt-1 font-nunito text-base text-secundario">{t('auth.registerIntro')}</Text>

        <Campo etiqueta={t('auth.name')} value={nombre} onChangeText={setNombre} autoComplete="name" placeholder={t('placeholders.name')} />
        <Campo
          etiqueta={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder={t('placeholders.email')}
        />
        <Campo
          etiqueta={t('auth.password')}
          value={contrasena}
          onChangeText={setContrasena}
          secreto
          etiquetaMostrar={t('auth.showPassword')}
          autoComplete="new-password"
          placeholder={t('placeholders.password')}
          className="mb-2"
        />
        <View className="mb-4 flex-row flex-wrap gap-x-5 gap-y-1">
          {requisito(letrasYNumeros, t('auth.reqLetters'))}
          {requisito(largoOk, t('auth.reqLength'))}
        </View>
        <Campo
          etiqueta={t('auth.phone')}
          opcional={t('auth.optional')}
          value={telefono}
          onChangeText={setTelefono}
          keyboardType="phone-pad"
          autoComplete="tel"
        />

        <Pressable
          onPress={() => setAcepta(!acepta)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acepta }}
          className="mt-1 min-h-11 flex-row items-center gap-3"
        >
          <View
            className={`h-7 w-7 items-center justify-center rounded-lg border-2 ${acepta ? 'border-boton bg-boton' : 'border-secundario bg-superficie'}`}
          >
            {acepta ? <Ionicons name="checkmark" size={18} color="#FFFFFF" /> : null}
          </View>
          <Text className="flex-1 font-nunito text-[15px] leading-5 text-secundario">
            {t('legal.accept')}{' '}
            <Link href="/legal" style={{ color: c.boton, fontFamily: 'Nunito_800ExtraBold', textDecorationLine: 'underline' }}>
              {t('legal.linkText')}
            </Link>
          </Text>
        </Pressable>
      </ScrollView>

      <View className="px-5 pb-2 pt-2">
        <Boton titulo={t('auth.registerSubmit')} cargando={enviando} onPress={onSubmit} />
        <Pressable onPress={() => router.replace('/login')} accessibilityRole="link" className="min-h-12 items-center justify-center">
          <Text className="font-nunito8 text-base text-secundario">
            {t('auth.haveAccount')} <Text className="font-nunito9 text-boton">{t('auth.loginTitle')}</Text>
          </Text>
        </Pressable>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
