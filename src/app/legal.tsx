import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Política de privacidad y Términos. Tiene que coincidir con lo que la app
// hace de verdad: si se agrega analytics, otro proveedor o un dato nuevo,
// actualizar este texto. Completar CONTACTO antes de publicar.
// PENDIENTE: email de ejemplo, reemplazar por el real antes de publicar.
const CONTACTO = 'maply.services@gmail.com';
const ACTUALIZADO = 'septiembre de 2026';

const SECCIONES: [string, string][] = [
  ['Política de privacidad', `Última actualización: ${ACTUALIZADO}.`],
  [
    'Qué datos guardamos',
    'Nombre, email, contraseña (guardada cifrada con bcrypt, nadie puede leerla), teléfono si lo cargás, y los reportes que publicás (texto, lugar, categoría y fecha). Tu ubicación GPS se usa solo en tu teléfono para centrar el mapa: no la guardamos en nuestros servidores.',
  ],
  [
    'Para qué',
    'Para que puedas iniciar sesión, publicar reportes y ver el estado de los lugares. No vendemos tus datos, no mostramos publicidad y no usamos herramientas de seguimiento o analytics.',
  ],
  [
    'Con quién se comparten',
    'Mapbox (mapas): recibe tu dirección IP y la zona del mapa que mirás para poder mostrarlo. El servidor donde se aloja la base de datos. Nadie más. Los reportes se muestran públicamente sin tu nombre ni tu email.',
  ],
  [
    'Tus derechos (Ley 25.326)',
    `Podés ver, corregir o borrar tus datos. Para borrarlos, usá "Eliminar mi cuenta" en Configuración: se borra tu perfil y todos tus reportes. Para otras consultas escribí a ${CONTACTO}. La Agencia de Acceso a la Información Pública (AAIP) es el órgano de control de la Ley 25.326 y recibe reclamos.`,
  ],
  ['Seguridad', 'Las contraseñas se guardan cifradas, la sesión se guarda cifrada en tu teléfono y se invalida en el servidor al salir. Ningún sistema es 100% seguro: si detectamos un problema que afecte tus datos, te vamos a avisar.'],
  ['Términos y condiciones', ''],
  [
    'El servicio',
    'Maply Services muestra reportes que publican otros usuarios sobre filas, demoras y el estado de lugares cercanos. La información es orientativa y puede no estar actualizada o ser incorrecta. No uses Maply para emergencias médicas: llamá al 107 o al 911.',
  ],
  ['Edad', 'Para crear una cuenta tenés que tener 13 años o más.'],
  [
    'Tu cuenta',
    'Sos responsable de lo que se publica con tu cuenta y de cuidar tu contraseña. Podés borrar la cuenta cuando quieras.',
  ],
  [
    'Uso aceptable',
    'No se permite publicar reportes falsos, insultos, datos personales de otras personas, publicidad ni contenido ilegal. Podemos ocultar reportes denunciados y bloquear cuentas que no cumplan estas reglas.',
  ],
  [
    'Contenido',
    'Los reportes son de quien los publica. Al publicarlos nos das permiso para mostrarlos dentro de la app. Si algo infringe tus derechos, escribinos a ' + CONTACTO + ' y lo revisamos.',
  ],
  [
    'Responsabilidad',
    'Maply es un proyecto académico (E.T. N° 32, Prácticas Profesionalizantes 2026). Se ofrece tal como está, sin garantías, y no nos hacemos responsables por decisiones tomadas en base a los reportes de otros usuarios.',
  ],
];

export default function LegalScreen() {
  return (
    <SafeAreaView className="flex-1 bg-maply-bg" edges={['bottom']}>
      <ScrollView contentContainerClassName="px-5 py-4">
        {SECCIONES.map(([titulo, texto]) => (
          <Text key={titulo} className="mb-4 text-sm leading-5 text-maply-ink">
            <Text className="text-base font-semibold">{titulo}</Text>
            {texto ? `\n${texto}` : ''}
          </Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
