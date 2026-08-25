import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Uploads de foto/vídeo do Jornal BL passam pela Server Action —
      // o limite padrão (1MB) é pequeno demais para vídeo curto.
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
