import {
  Bricolage_Grotesque,
  Space_Grotesk,
  Space_Mono,
  Young_Serif,
} from "next/font/google";

/**
 * D-05 — Fontes hospedadas junto.
 *
 * `next/font/google` baixa os arquivos no build e serve pelo próprio domínio:
 * o navegador nunca fala com o Google. Só os pesos que specs/05 lista — cada
 * peso a mais custa no 4G do corredor do INF, à noite, que é onde o mentor
 * abre isto de verdade.
 *
 * Instrument Serif não entra aqui: vive só no documento final, que é gerado
 * fora do app. Young Serif entra porque a home a usa na tagline — um peso só.
 */

export const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "800"],
  variable: "--fonte-bricolage",
  display: "swap",
});

export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--fonte-space-grotesk",
  display: "swap",
});

export const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--fonte-space-mono",
  display: "swap",
});

/** Só na home: "De pessoas. Para pessoas." */
export const youngSerif = Young_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--fonte-young-serif",
  display: "swap",
});

export const variaveisDeFonte = [
  bricolage.variable,
  spaceGrotesk.variable,
  spaceMono.variable,
  youngSerif.variable,
].join(" ");
