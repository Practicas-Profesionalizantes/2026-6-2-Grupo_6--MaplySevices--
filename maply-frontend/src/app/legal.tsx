import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Encabezado } from '@/components/ui';

// Política de privacidad y Términos. Tiene que coincidir con lo que la app
// hace de verdad: si se agrega analytics, otro proveedor o un dato nuevo,
// actualizar este texto. Completar CONTACTO antes de publicar.
// PENDIENTE: email de ejemplo, reemplazar por el real antes de publicar.
const CONTACTO = 'maply.services@gmail.com';
// Las dos versiones tienen que decir lo mismo: si cambiás una, cambiá la otra.
const SECCIONES: Record<'es' | 'en', [string, string][]> = {
  es: [
    ['Política de privacidad', 'Última actualización: septiembre de 2026.'],
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
      'Mapbox (mapas): recibe tu dirección IP y la zona del mapa que mirás para poder mostrarlo. Google (Gmail): si pedís recuperar tu contraseña, el código te llega por mail a través de Gmail. MyMemory (traducción): si tocás "Ver traducción", recibe el texto de ese reporte, que ya es público. El servidor donde se aloja la base de datos. Nadie más. Los reportes se muestran públicamente sin tu nombre ni tu email.',
    ],
    [
      'Tus derechos (Ley 25.326)',
      `Podés ver, corregir o borrar tus datos. Para borrarlos, usá "Eliminar mi cuenta" en Configuración: se borra tu perfil y todos tus reportes. Para otras consultas escribí a ${CONTACTO}. La Agencia de Acceso a la Información Pública (AAIP) es el órgano de control de la Ley 25.326 y recibe reclamos.`,
    ],
    [
      'Seguridad',
      'Las contraseñas se guardan cifradas, la sesión se guarda cifrada en tu teléfono y se invalida en el servidor al salir. Ningún sistema es 100% seguro: si detectamos un problema que afecte tus datos, te vamos a avisar.',
    ],
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
      'Los reportes son de quien los publica. Al publicarlos nos das permiso para mostrarlos dentro de la app. Si algo infringe tus derechos, escribinos a ' +
        CONTACTO +
        ' y lo revisamos.',
    ],
    [
      'Responsabilidad',
      'Maply es un proyecto académico (E.T. N° 32, Prácticas Profesionalizantes 2026). Se ofrece tal como está, sin garantías, y no nos hacemos responsables por decisiones tomadas en base a los reportes de otros usuarios.',
    ],
  ],
  en: [
    ['Privacy policy', 'Last updated: September 2026.'],
    [
      'What data we store',
      'Name, email, password (stored encrypted with bcrypt, nobody can read it), phone number if you add one, and the reports you post (text, place, category and date). Your GPS location is only used on your phone to center the map: we do not store it on our servers.',
    ],
    [
      'What for',
      'So you can sign in, post reports and see the status of places. We do not sell your data, show ads or use tracking or analytics tools.',
    ],
    [
      'Who we share it with',
      'Mapbox (maps): receives your IP address and the map area you are viewing so it can display it. Google (Gmail): if you ask to reset your password, the code is emailed to you through Gmail. MyMemory (translation): if you tap "See translation", it receives the text of that report, which is already public. The server that hosts the database. Nobody else. Reports are shown publicly without your name or email.',
    ],
    [
      'Your rights (Argentine Law 25.326)',
      `You can view, correct or delete your data. To delete it, use "Delete my account" in Settings: your profile and all your reports are deleted. For other requests, write to ${CONTACTO}. The Agency for Access to Public Information (AAIP) is the authority that enforces Law 25.326 and handles complaints.`,
    ],
    [
      'Security',
      'Passwords are stored encrypted, your session is stored encrypted on your phone and is invalidated on the server when you sign out. No system is 100% secure: if we detect a problem that affects your data, we will let you know.',
    ],
    ['Terms and conditions', ''],
    [
      'The service',
      'Maply Services shows reports posted by other users about lines, delays and the status of nearby places. The information is only a guide and may be outdated or wrong. Do not use Maply for medical emergencies: call 107 or 911.',
    ],
    ['Age', 'You must be 13 or older to create an account.'],
    [
      'Your account',
      'You are responsible for what is posted with your account and for keeping your password safe. You can delete your account at any time.',
    ],
    [
      'Acceptable use',
      'Fake reports, insults, other people’s personal data, advertising and illegal content are not allowed. We may hide reported posts and block accounts that break these rules.',
    ],
    [
      'Content',
      'Reports belong to the people who post them. By posting, you allow us to show them in the app. If something infringes your rights, write to ' +
        CONTACTO +
        ' and we will review it.',
    ],
    [
      'Liability',
      'Maply is a school project (E.T. N° 32, Prácticas Profesionalizantes 2026). It is provided as is, without warranties, and we are not responsible for decisions made based on other users’ reports.',
    ],
  ],
};

export default function LegalScreen() {
  const { t, i18n } = useTranslation();
  const secciones = SECCIONES[i18n.language === 'en' ? 'en' : 'es'];
  return (
    <SafeAreaView className="flex-1 bg-fondo">
      <ScrollView contentContainerClassName="px-5 pt-4 pb-8">
        <Encabezado titulo={t('config.privacy')} label={t('reportDetails.back')} />
        {secciones.map(([titulo, texto]) => (
          <View key={titulo} className="mb-5">
            <Text className="mb-1 font-nunito9 text-[22px] leading-7 text-texto">{titulo}</Text>
            {texto ? <Text className="font-nunito text-base leading-6 text-secundario">{texto}</Text> : null}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
