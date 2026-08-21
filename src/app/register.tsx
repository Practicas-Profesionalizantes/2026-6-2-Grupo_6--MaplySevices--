import { useState } from 'react';
import { Alert, Pressable, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { login, register } from '@/services/api';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [telefono, setTelefono] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function onSubmit() {
    if (!nombre.trim() || !email.trim() || contrasena.length < 8) {
      Alert.alert(t('auth.registerErrorTitle'), t('auth.registerValidation'));
      return;
    }
    setEnviando(true);
    try {
      await register({
        nombre: nombre.trim(),
        email: email.trim(),
        contrasena,
        telefono: telefono.trim() || undefined,
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

  return (
    <SafeAreaView className="flex-1 bg-maply-bg px-5 pt-4">
      <Text className="mb-2 text-sm font-semibold text-maply-muted">{t('auth.name')}</Text>
      <TextInput
        value={nombre}
        onChangeText={setNombre}
        placeholder="Tu nombre"
        className="mb-4 rounded-2xl border border-maply-card-border bg-white p-3 text-maply-ink"
      />

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
        placeholder="Mínimo 8 caracteres"
        className="mb-4 rounded-2xl border border-maply-card-border bg-white p-3 text-maply-ink"
      />

      <Text className="mb-2 text-sm font-semibold text-maply-muted">{t('auth.phoneOptional')}</Text>
      <TextInput
        value={telefono}
        onChangeText={setTelefono}
        keyboardType="phone-pad"
        placeholder="(opcional)"
        className="mb-6 rounded-2xl border border-maply-card-border bg-white p-3 text-maply-ink"
      />

      <Pressable
        disabled={enviando}
        onPress={onSubmit}
        className="items-center rounded-full bg-maply-violeta px-4 py-3"
      >
        <Text className="font-semibold text-white">{t('auth.registerSubmit')}</Text>
      </Pressable>

      <Pressable onPress={() => router.replace('/login')} className="mt-4 items-center">
        <Text className="text-sm text-maply-muted">{t('auth.goLogin')}</Text>
      </Pressable>
    </SafeAreaView>
  );
}
