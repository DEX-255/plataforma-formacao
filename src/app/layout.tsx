import type { Metadata, Viewport } from "next";
import { variaveisDeFonte } from "./tipografia";
import { PRETO } from "./cores-literais";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "DEX",
    template: "%s · DEX",
  },
  description:
    "Plataforma da Formação DEX — Hub de Empreendedorismo e Inovação do Instituto de Informática da UFG.",
  // A área logada guarda avaliação nominal de estudantes. Nada dela deve
  // aparecer em buscador, nem por acidente de rota pública.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: PRETO,
  // Sem maximum-scale: impedir zoom é barreira de acessibilidade, e metade
  // do uso é no celular com luz ruim.
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={variaveisDeFonte}>
      <body>{children}</body>
    </html>
  );
}
