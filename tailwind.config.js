/** @type {import('tailwindcss').Config} */
// Los colores de tema son variables que _layout.tsx completa desde
// src/constants/Colors.ts según el modo claro/oscuro del sistema.
const tema = (nombre) => `var(--${nombre})`;

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        fondo: tema('fondo'),
        superficie: tema('superficie'),
        tarjeta: tema('tarjeta'),
        texto: tema('texto'),
        secundario: tema('secundario'),
        borde: tema('borde'),
        boton: tema('boton'),
        peligro: tema('peligro'),
      },
      // En Android cada peso de Nunito es una fuente aparte: el peso se elige
      // con la familia (font-nunito9 = 900), nunca con font-bold/fontWeight.
      fontFamily: {
        nunito: ['Nunito_400Regular'],
        nunito6: ['Nunito_600SemiBold'],
        nunito7: ['Nunito_700Bold'],
        nunito8: ['Nunito_800ExtraBold'],
        nunito9: ['Nunito_900Black'],
      },
    },
  },
  plugins: [],
};
