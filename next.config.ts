import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Sem imagem remota: a marca é servida pelo próprio domínio (D-05) e os
  // gráficos são SVG à mão. Nada aqui precisa de otimizador de terceiro.
  images: { remotePatterns: [] },

  // O bloco interno do feedback nunca deve aparecer numa resposta de erro.
  poweredByHeader: false,
};

export default nextConfig;
