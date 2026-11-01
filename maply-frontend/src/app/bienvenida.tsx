import { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Boton } from '@/components/ui';
import { marcarBienvenidaVista } from '@/services/api';

// Se ve una sola vez (index.tsx lo decide). El degradé de marca va solo acá.
export default function BienvenidaScreen() {
  const { t } = useTranslation();
  const sinMovimiento = useReducedMotion();
  const escala = useSharedValue(sinMovimiento ? 1 : 0.6);
  const flote = useSharedValue(0);
  const deriva = useSharedValue(0);

  // Entra con rebote y después flota suave. Todo el ingreso dura < 1,2 s.
  useEffect(() => {
    if (sinMovimiento) return;
    escala.value = withSpring(1, { damping: 9, stiffness: 140 });
    flote.value = withDelay(
      900,
      withRepeat(withSequence(withTiming(-6, { duration: 1600 }), withTiming(0, { duration: 1600 })), -1)
    );
    // Las calles del fondo se desplazan muy lento: ida y vuelta en 20 s.
    deriva.value = withRepeat(withTiming(1, { duration: 10000 }), -1, true);
  }, [sinMovimiento, escala, flote, deriva]);

  const estiloCalles = useAnimatedStyle(() => ({
    transform: [
      { scale: 1.08 }, // un poco más grande para que no se vean los bordes al moverse
      { translateX: -12 + deriva.value * 24 },
      { translateY: 8 - deriva.value * 16 },
    ],
  }));

  const estiloLogo = useAnimatedStyle(() => ({
    transform: [{ scale: escala.value }, { translateY: flote.value }],
  }));

  async function seguir(destino: '/' | '/login') {
    await marcarBienvenidaVista();
    router.replace(destino);
  }

  const entrada = (demora: number) => (sinMovimiento ? undefined : FadeInUp.delay(demora).duration(450));

  return (
    <View
      className="flex-1"
      style={{ experimental_backgroundImage: 'linear-gradient(160deg, #3D98F5 0%, #3E50E3 55%, #7051ED 100%)' }}
    >
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, estiloCalles]}>
        <FondoCalles />
      </Animated.View>
      <SafeAreaView className="flex-1 px-6">
        <View className="flex-1 items-center justify-center">
          <Animated.View style={[estiloLogo, { borderRadius: 42, padding: 10, backgroundColor: "rgba(255,255,255,0.15)" }]}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={{ width: 128, height: 128, borderRadius: 34 }}
              accessibilityIgnoresInvertColors
            />
          </Animated.View>
          <Animated.View entering={entrada(300)} style={{ marginTop: 24, alignItems: 'center' }}>
            <Text className="font-nunito9 text-[48px] leading-[54px] text-white">maply</Text>
            <Text className="font-nunito8 text-[15px] text-white/85" style={{ letterSpacing: 7 }}>
              SERVICES
            </Text>
          </Animated.View>
          <Animated.View entering={entrada(450)} style={{ marginTop: 40 }}>
            <Text className="max-w-[300px] text-center font-nunito6 text-[22px] leading-[30px] text-white">
              {t('welcome.tagline')}
            </Text>
          </Animated.View>
        </View>

        <View className="pb-4">
          <Boton titulo={t('welcome.start')} variante="blanco" onPress={() => seguir('/')} />
          <Pressable
            onPress={() => seguir('/login')}
            accessibilityRole="link"
            className="mt-2 min-h-12 items-center justify-center"
          >
            <Text className="font-nunito8 text-base text-white">{t('welcome.haveAccount')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

// Calles de mapa estilizadas del mockup, en blanco al 15 %. Decorativo.
function FondoCalles() {
  const trazo = { stroke: 'rgba(255,255,255,0.15)', strokeWidth: 6, fill: 'none', strokeLinecap: 'round' as const };
  return (
    <Svg width="100%" height="100%" viewBox="0 0 435 940" preserveAspectRatio="xMidYMid slice">
      <Path d="M105 -20 C 115 150, 125 300, 110 450 S 80 700, 100 960" {...trazo} />
      <Path d="M335 -20 C 330 150, 318 330, 335 450 S 365 600, 368 960" {...trazo} />
      <Path d="M-20 215 C 80 255, 170 250, 245 225 S 380 195, 455 215" {...trazo} />
      <Path d="M-20 440 L 455 485" {...trazo} />
      <Path d="M-20 625 C 110 655, 220 610, 300 595 S 400 575, 455 590" {...trazo} />
      <Circle cx={88} cy={155} r={6} fill="rgba(255,255,255,0.18)" />
      <Circle cx={378} cy={388} r={6} fill="rgba(255,255,255,0.18)" />
    </Svg>
  );
}
