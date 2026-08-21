import type { ReactNode } from 'react';
import { View, Text } from 'react-native';

// Nombre de archivo con mayúscula a propósito (Header.tsx), consistente con
// cómo se importa en el resto de las pantallas — el bug de case-sensitivity
// del proyecto anterior (import '../components/Header' contra un archivo
// header.tsx en minúscula) no debería repetirse acá.

export function Header({ title, rightSlot }: { title: string; rightSlot?: ReactNode }) {
  // Nota: para el degradé azul -> violeta del logo real hace falta
  // expo-linear-gradient (NativeWind solo no dibuja gradientes en RN);
  // por ahora un fondo pastel sólido, fácil de reemplazar después.
  return (
    <View className="flex-row items-center justify-between bg-maply-celeste px-5 pb-4 pt-2">
      <View className="flex-row items-center gap-2">
        <View className="h-8 w-8 rounded-full bg-maply-azul" />
        <Text className="text-xl font-bold text-maply-ink">{title}</Text>
      </View>
      {rightSlot}
    </View>
  );
}

export default Header;
