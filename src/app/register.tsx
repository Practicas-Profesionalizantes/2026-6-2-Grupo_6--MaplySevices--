import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { login, register } from '@/services/api';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [telefono, setTelefono] = useState('');
  const [acepta, setAcepta] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit() {
    if (!nombre.trim() || !email.trim() || contrasena.length < 8 || !/[A-Za-z]/.test(contrasena) || !/\d/.test(contrasena)) {
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
        placeholder="Mínimo 8, con letras y números"
        className="mb-4 rounded-2xl border border-maply-card-border bg-white p-3 text-maply-ink"
      />

      <Text className="mb-2 text-sm font-semibold text-maply-muted">{t('auth.phoneOptional')}</Text>
      <TextInput
        value={telefono}
        onChangeText={setTelefono}
        keyboardType="phone-pad"
        placeholder="(opcional)"
        className="mb-4 rounded-2xl border border-maply-card-border bg-white p-3 text-maply-ink"
      />

      <Pressable
        onPress={() => setAcepta(!acepta)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: acepta }}
        className="mb-6 flex-row items-center gap-3"
      >
        <View
          className={`h-6 w-6 items-center justify-center rounded-md border-2 ${acepta ? 'border-maply-violeta bg-maply-violeta' : 'border-maply-muted bg-white'}`}
        >
          {acepta ? <Text className="font-bold text-white">✓</Text> : null}
        </View>
        <Text className="flex-1 text-sm text-maply-ink">
          {t('legal.accept')}{' '}
          <Link href="/legal" className="font-semibold text-maply-violeta underline">
            {t('legal.linkText')}
          </Link>
        </Text>
      </Pressable>

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
