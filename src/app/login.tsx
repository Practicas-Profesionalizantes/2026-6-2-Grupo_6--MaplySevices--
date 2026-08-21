import { useState } from 'react';
import { Alert, Pressable, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

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
    <SafeAreaView className="flex-1 bg-maply-bg px-5 pt-4">
      <Text className="mb-2 text-sm font-semibold text-maply-muted">{t('auth.email')}</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="vos@ejemplo.com"
        className="mb-4 rounded-2xl border border-maply-card-border bg-white p-3 text-maply-ink"
      />

      <Text className="mb-2 text-sm font-semibold text-maply-muted">{t('auth.password')}</Text>
      <TextInput
        value={contrasena}
        onChangeText={setContrasena}
        secureTextEntry
        placeholder="••••••••"
        className="mb-6 rounded-2xl border border-maply-card-border bg-white p-3 text-maply-ink"
      />

      <Pressable
        disabled={enviando}
        onPress={onSubmit}
        className="items-center rounded-full bg-maply-violeta px-4 py-3"
      >
        <Text className="font-semibold text-white">{t('auth.loginSubmit')}</Text>
      </Pressable>

      <Pressable onPress={() => router.replace('/register')} className="mt-4 items-center">
        <Text className="text-sm text-maply-muted">{t('auth.goRegister')}</Text>
      </Pressable>
    </SafeAreaView>
  );
}
