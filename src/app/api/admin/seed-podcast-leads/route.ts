import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import type { PodcastStatus, PodcastSource } from "@prisma/client";

function d(year: number, month: number, day: number) {
  return new Date(year, month - 1, day, 12, 0, 0);
}

type Row = {
  episodeNumber?: number;
  guestName: string;
  guestBrand?: string;
  recordingDate?: Date;
  guestBrandInstagram?: string;
  guestPersonalInstagram?: string;
  materialDeadline?: Date;
  postDate?: Date;
  rawMaterialUrl?: string;
  editedMaterialUrl?: string;
  status: PodcastStatus;
  source: PodcastSource;
};

const ROWS: Row[] = [
  {
    episodeNumber: 245,
    guestName: "Nivaldo Marinho Jr",
    guestBrand: "Renova Be",
    recordingDate: d(2026, 8, 11),
    guestBrandInstagram: "http://instagram.com/renovabeoficial",
    guestPersonalInstagram: "http://instagram.com/marinhonivaldojr",
    materialDeadline: d(2026, 8, 17),
    postDate: d(2026, 8, 18),
    rawMaterialUrl: "https://drive.google.com/file/d/1xqg8H1kHXmxBcQ-8kccnwqFABglGtDtc/view?usp=drive_link",
    editedMaterialUrl: "https://drive.google.com/drive/folders/1KGofL0gNn_rzaortO9sZknY7tGuMc5GR?usp=drive_link",
    status: "material_em_edicao",
    source: "outro",
  },
  {
    episodeNumber: 246,
    guestName: "Edu Reis",
    guestBrand: "Pink Dreams",
    recordingDate: d(2026, 8, 11),
    guestBrandInstagram: "http://instagram.com/pinkdreampijamas",
    guestPersonalInstagram: "http://instagram.com/edcristian",
    materialDeadline: d(2026, 8, 24),
    postDate: d(2026, 9, 1),
    rawMaterialUrl: "https://drive.google.com/file/d/1gN-IsZfidlcH_eigg-ux09zS1xLErUBz/view?usp=drive_link",
    status: "esperando_material",
    source: "outro",
  },
  {
    episodeNumber: 247,
    guestName: "Sté Gustavson",
    guestBrand: "Amokarite",
    recordingDate: d(2026, 7, 24),
    guestBrandInstagram: "http://instagram.com/amokarite",
    guestPersonalInstagram: "http://instagram.com/ste.gustavson",
    materialDeadline: d(2026, 8, 31),
    postDate: d(2026, 9, 1),
    rawMaterialUrl: "https://drive.google.com/drive/folders/1Jjq1yfTxpF3JMniIcFOw98sA_LYYFiol?usp=drive_link",
    status: "esperando_material",
    source: "outro",
  },
  {
    episodeNumber: 248,
    guestName: "Bruna Moura",
    guestBrand: "Vicio Zero",
    recordingDate: d(2026, 7, 29),
    guestBrandInstagram: "http://instagram.com/vicio.zero",
    guestPersonalInstagram: "http://instagram.com/mourabu",
    materialDeadline: d(2026, 9, 7),
    postDate: d(2026, 9, 8),
    rawMaterialUrl: "https://drive.google.com/drive/folders/1mTA7C5pPR53Tkx-adSh7wXJBY8ZFAe_S?usp=drive_link",
    status: "esperando_material",
    source: "outro",
  },
  {
    episodeNumber: 249,
    guestName: "Dennys Xavier",
    guestBrand: "Dennys Xavier",
    recordingDate: d(2026, 8, 14),
    guestBrandInstagram: "http://instagram.com/sociedade_da_lanterna",
    guestPersonalInstagram: "http://instagram.com/prof.dennysxavier",
    materialDeadline: d(2026, 9, 14),
    postDate: d(2026, 9, 15),
    rawMaterialUrl: "https://drive.google.com/drive/folders/1mTA7C5pPR53Tkx-adSh7wXJBY8ZFAe_S?usp=drive_link",
    status: "esperando_material",
    source: "outro",
  },
  {
    episodeNumber: 250,
    guestName: "Carla Tafner",
    guestBrand: "Le Blog Store",
    recordingDate: d(2026, 8, 14),
    guestBrandInstagram: "http://instagram.com/leblogstore",
    guestPersonalInstagram: "http://instagram.com/carlatafner",
    materialDeadline: d(2026, 9, 21),
    postDate: d(2026, 9, 22),
    status: "entrevista_reagendando",
    source: "karina_social_seller",
  },
  {
    guestName: "Leonardo Mazurek (11h)",
    recordingDate: d(2026, 9, 4),
    guestBrandInstagram: "https://www.instagram.com/podkombucha/",
    guestPersonalInstagram: "https://www.instagram.com/leo.mazurek/",
    status: "entrevista_reagendando",
    source: "karina_social_seller",
  },
  {
    guestName: "Luiz Nakoneczny — remarcar mais pra frente",
    recordingDate: d(2026, 9, 4),
    guestPersonalInstagram: "https://www.instagram.com/luizhenriquenako/",
    status: "entrevista_reagendando",
    source: "dom",
  },
  {
    guestName: "Erivaldo Neto (9h)",
    recordingDate: d(2026, 10, 2),
    status: "entrevista_marcada",
    source: "outro",
  },
  { guestName: "Monique Evelle", status: "entrevista_reagendando", source: "outro" },
  { guestName: "Julio Cicatribem", status: "entrevista_reagendando", source: "outro" },
  { guestName: "Priscila Amos", guestBrand: "Bloom", status: "entrevista_reagendando", source: "outro" },
  {
    guestName: "Victor Wanderley (13h)",
    guestBrandInstagram: "https://www.instagram.com/dobem/",
    guestPersonalInstagram: "https://www.instagram.com/vwanderley/",
    status: "entrevista_reagendando",
    source: "karina_social_seller",
  },
  {
    guestName: "Reinaldo Zanon",
    guestPersonalInstagram: "https://www.instagram.com/reinaldozanon/",
    status: "entrevista_reagendando",
    source: "dom",
  },
  {
    guestName: "Mario e Bruno (11h)",
    recordingDate: d(2026, 10, 2),
    guestBrandInstagram: "https://www.instagram.com/buckler.fit/",
    status: "entrevista_marcada",
    source: "dom",
  },
  {
    guestName: "Fabio Oliveira (11h)",
    recordingDate: d(2026, 9, 25),
    guestBrandInstagram: "https://www.instagram.com/bigens.com.br/",
    status: "entrevista_marcada",
    source: "dom",
  },
  {
    guestName: "Tatiane Brito (9h)",
    recordingDate: d(2026, 9, 25),
    guestBrandInstagram: "https://www.instagram.com/absolutplussize?igsh=aWI5aTltMnZ3Zzdl",
    guestPersonalInstagram: "https://www.instagram.com/eutatianebrito/",
    status: "entrevista_marcada",
    source: "karina_social_seller",
  },
  {
    guestName: "Dayane Ortega",
    guestBrandInstagram: "https://www.instagram.com/dayortega.oficial/",
    guestPersonalInstagram: "https://www.instagram.com/dayaneortega/",
    status: "entrevista_reagendando",
    source: "karina_social_seller",
  },
  {
    guestName: "Fernanda Manzke (11h)",
    recordingDate: d(2026, 8, 28),
    guestBrandInstagram: "https://www.instagram.com/docetramaoficial?igsh=d3p5YXhod2YzZmp2",
    status: "entrevista_reagendando",
    source: "karina_social_seller",
  },
  {
    guestName: "Diogo Kobata (11h)",
    recordingDate: d(2026, 8, 21),
    guestBrandInstagram: "https://www.instagram.com/mvmcreators/",
    guestPersonalInstagram: "https://www.instagram.com/diogokobata/",
    status: "entrevista_reagendando",
    source: "dom",
  },
  {
    guestName: "Bruno e Ian — Cloud Humans (urgente)",
    recordingDate: d(2026, 8, 28),
    status: "entrevista_reagendando",
    source: "dom",
  },
  { guestName: "Misa Antonini (13h)", recordingDate: d(2026, 9, 18), status: "entrevista_marcada", source: "dom" },
  {
    guestName: "Drive de Alphaville",
    rawMaterialUrl: "https://drive.google.com/drive/folders/10_kXnXxGiviXmS_1IAUJX-Ot5O3D0AR8",
    status: "em_conversa",
    source: "outro",
  },
  { guestName: "Joaozinho (@eblaskincare)", recordingDate: d(2026, 9, 18), status: "entrevista_marcada", source: "outro" },
];

/**
 * Rota temporária admin-gated pra popular os episódios/leads reais do
 * Podcast — chamada 1x via fetch autenticado, depois removida (mesmo padrão
 * já usado nesta sessão pra carregar dado real em produção). Idempotente por
 * guestName+source pra suportar um retry seguro.
 */
export async function POST() {
  const user = await requireUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const results: { guestName: string; action: "created" | "updated" }[] = [];

  for (const row of ROWS) {
    const existing = await prisma.podcastEpisode.findFirst({
      where: { guestName: row.guestName, source: row.source },
    });
    if (existing) {
      await prisma.podcastEpisode.update({ where: { id: existing.id }, data: row });
      results.push({ guestName: row.guestName, action: "updated" });
    } else {
      await prisma.podcastEpisode.create({ data: row });
      results.push({ guestName: row.guestName, action: "created" });
    }
  }

  return NextResponse.json({ count: results.length, results });
}
