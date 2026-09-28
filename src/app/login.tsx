import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Boton, Campo, Encabezado } from '@/components/ui';
import { login } from '@/services/api';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function onSubmit() {
    if (!email.trim() || !contrasena) return;
    setEnviando(true);
    try {
      await login({ email: email.trim(), contrasena });
      router.replace('/');
    } catch (e: any) {
      Alert.alert(t('auth.loginErrorTitle'), e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-fondo">
      <KeyboardAvoidingView behavior="padding" className="flex-1">
      <ScrollView contentContainerClassName="px-5 pt-4 pb-4" contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <Encabezado label={t('reportDetails.back')} />
        <Image source={require('@/assets/images/logo.png')} style={{ width: 72, height: 72, borderRadius: 20 }} />
        <Text className="mt-4 font-nunito9 text-[32px] leading-10 text-texto">{t('auth.loginTitle')}</Text>
        <Text className="mb-6 mt-1 font-nunito text-base text-secundario">{t('auth.loginIntro')}</Text>

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
          autoComplete="current-password"
          placeholder="••••••••"
          className="mb-1"
        />

        <Pressable onPress={() => router.push('/olvide-contrasena')} accessibilityRole="link" className="min-h-11 justify-center self-end">
          <Text className="font-nunito8 text-sm text-boton">{t('auth.forgotLink')}</Text>
        </Pressable>
      </ScrollView>

      <View className="px-5 pb-2 pt-2">
        <Boton titulo={t('auth.loginSubmit')} cargando={enviando} onPress={onSubmit} />
        <Pressable onPress={() => router.replace('/register')} accessibilityRole="link" className="min-h-12 items-center justify-center">
          <Text className="font-nunito8 text-base text-secundario">
            {t('auth.noAccount')} <Text className="font-nunito9 text-boton">{t('auth.registerLink')}</Text>
          </Text>
        </Pressable>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
