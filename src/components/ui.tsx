// Piezas visuales compartidas del rediseño: botón que se achica al tocarlo,
// botón volver, campo con etiqueta, ícono de estado y "hace X min".
import { useState, type ComponentProps, type ReactNode } from 'react';
import { Pressable, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { TFunction } from 'i18next';

import { colorEstado, fondoEstado, useColores } from '@/constants/Colors';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export const ICONOS_ESTADO: Record<string, IconName> = {
  mucha_fila: 'people-outline',
  lugar_lleno: 'warning-outline',
  cerrado: 'lock-closed-outline',
  demora: 'time-outline',
  atencion_rapida: 'checkmark',
  poco_movimiento: 'hourglass-outline',
  cambio_recorrido: 'swap-horizontal',
  otro: 'ellipsis-horizontal',
};

export const ICONOS_LUGAR: Record<string, IconName> = {
  hospital: 'medkit-outline',
  banco: 'card-outline',
  restaurante: 'restaurant-outline',
  transporte: 'bus-outline',
  comercio: 'storefront-outline',
  oficina_publica: 'business-outline',
  otro: 'location-outline',
};

// Se achica al 97 % mientras se toca. Con "reducir movimiento" activo,
// withTiming salta directo al final (ReduceMotion.System por defecto).
// `exterior` es el estilo de la caja animada (para flex-1 en filas, etc.).
export function Tocable({
  exterior,
  className,
  children,
  ...props
}: ComponentProps<typeof Pressable> & { exterior?: StyleProp<ViewStyle>; className?: string; children: ReactNode }) {
  const escala = useSharedValue(1);
  const animado = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }));
  return (
    <Animated.View style={[animado, exterior]}>
      <Pressable
        accessibilityRole="button"
        onPressIn={() => (escala.value = withTiming(0.97, { duration: 90 }))}
        onPressOut={() => (escala.value = withTiming(1, { duration: 120 }))}
        className={className}
        {...props}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const VARIANTES = {
  primario: { caja: 'bg-boton', texto: 'text-white' },
  blanco: { caja: 'bg-white', texto: 'text-[#3E50E3]' },
  peligro: { caja: 'border-[1.5px] border-[#E5484D66] bg-transparent', texto: 'text-peligro' },
  neutro: { caja: 'border-[1.5px] border-borde bg-superficie', texto: 'text-texto' },
};

export function Boton({
  titulo,
  variante = 'primario',
  icono,
  cargando,
  ...props
}: Omit<ComponentProps<typeof Tocable>, 'children'> & {
  titulo: string;
  variante?: keyof typeof VARIANTES;
  icono?: IconName;
  cargando?: boolean;
}) {
  const c = useColores();
  const v = VARIANTES[variante];
  const colorTexto = { primario: '#FFFFFF', blanco: '#3E50E3', peligro: c.peligro, neutro: c.texto }[variante];
  return (
    <Tocable
      {...props}
      disabled={props.disabled || cargando}
      className={`min-h-14 flex-row items-center justify-center gap-2 rounded-[18px] px-5 ${v.caja} ${props.disabled || cargando ? 'opacity-60' : ''}`}
    >
      {icono ? <Ionicons name={icono} size={20} color={colorTexto} /> : null}
      <Text className={`font-nunito8 text-base ${v.texto}`}>{titulo}</Text>
    </Tocable>
  );
}

// Botón redondo flotante (volver, cerrar, configuración, mi ubicación).
export function BotonRedondo({
  icono,
  onPress,
  accessibilityLabel,
}: {
  icono: IconName;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const c = useColores();
  return (
    <Tocable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      hitSlop={4}
      className="h-12 w-12 items-center justify-center rounded-full border border-borde bg-superficie"
      style={{ shadowColor: '#0E1330', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3, borderRadius: 24 }}
    >
      <Ionicons name={icono} size={22} color={c.texto} />
    </Tocable>
  );
}

export function volver() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

// Fila de título con botón volver (o cerrar) a la izquierda.
export function Encabezado({ titulo, cerrar, label }: { titulo?: string; cerrar?: boolean; label: string }) {
  return (
    <View className="mb-5 mt-2 flex-row items-center gap-4">
      <BotonRedondo icono={cerrar ? 'close' : 'chevron-back'} onPress={volver} accessibilityLabel={label} />
      {titulo ? <Text className="flex-1 font-nunito9 text-[32px] leading-10 text-texto">{titulo}</Text> : null}
    </View>
  );
}

// Campo con etiqueta arriba y borde índigo al enfocar. Con `secreto`
// suma el ojo para mostrar u ocultar lo escrito.
export function Campo({
  etiqueta,
  opcional,
  secreto,
  etiquetaMostrar,
  className,
  ...props
}: ComponentProps<typeof TextInput> & {
  etiqueta: string;
  opcional?: string;
  secreto?: boolean;
  etiquetaMostrar?: string;
}) {
  const c = useColores();
  const [foco, setFoco] = useState(false);
  const [visible, setVisible] = useState(false);
  return (
    <View className={className ?? 'mb-4'}>
      <Text className="mb-2 font-nunito8 text-[15px] text-texto">
        {etiqueta}
        {opcional ? <Text className="font-nunito text-secundario"> ({opcional})</Text> : null}
      </Text>
      <View
        className={`flex-row items-center rounded-2xl border-[1.5px] bg-superficie ${foco ? 'border-boton' : 'border-borde'}`}
      >
        <TextInput
          placeholderTextColor={c.secundario}
          {...props}
          secureTextEntry={secreto && !visible}
          onFocus={(e) => {
            setFoco(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFoco(false);
            props.onBlur?.(e);
          }}
          className="min-h-14 flex-1 px-4 py-3 font-nunito text-base text-texto"
          style={props.multiline ? { minHeight: 110, textAlignVertical: 'top' } : undefined}
        />
        {secreto ? (
          <Pressable
            onPress={() => setVisible(!visible)}
            accessibilityRole="button"
            accessibilityLabel={etiquetaMostrar}
            className="h-12 w-12 items-center justify-center"
          >
            <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color={c.secundario} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

// Cuadrado con el ícono del estado sobre su color al 15 %.
export function IconoEstado({ categoria, tamano = 52 }: { categoria: string; tamano?: number }) {
  return (
    <View
      className="items-center justify-center"
      style={{ width: tamano, height: tamano, borderRadius: tamano * 0.3, backgroundColor: fondoEstado(categoria) }}
    >
      <Ionicons name={ICONOS_ESTADO[categoria] ?? 'ellipsis-horizontal'} size={tamano * 0.46} color={colorEstado(categoria)} />
    </View>
  );
}

export function haceCuanto(fechaIso: string, t: TFunction) {
  const min = Math.max(0, Math.floor((Date.now() - new Date(fechaIso).getTime()) / 60000));
  if (min < 1) return t('tiempo.ahora');
  if (min < 60) return t('tiempo.minutos', { count: min });
  if (min < 60 * 24) return t('tiempo.horas', { count: Math.floor(min / 60) });
  return t('tiempo.dias', { count: Math.floor(min / 1440) });
}

export const sombraSuave: ViewStyle = {
  shadowColor: '#0E1330',
  shadowOpacity: 0.08,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 6 },
  elevation: 2,
};
