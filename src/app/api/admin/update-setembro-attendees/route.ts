import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import type { AttendeeCategory } from "@prisma/client";

/**
 * Rota temporaria — atualiza a lista de Confirmados da Imersao Scale
 * Setembro 2026 a partir da planilha mais recente enviada pelo usuario
 * ("Dashboard Brand Legacy - Eventos 2026 (4).xlsx", aba "Scale Setembro
 * 2026", secao INSCRITOS NA IMERSAO).
 *
 * A planilha em si tinha nomes duplicados (mesma pessoa reescrita, ou nomes
 * iguais de pessoas diferentes) - ja resolvido offline antes de gerar esta
 * lista: "Luiz Antonio/Antônio de Farias" e "EDUARDO BIDESE" (2x cada,
 * mesma empresa) foram mesclados num so registro; "Rafael Coelho" (2x,
 * empresas diferentes - Grupo ROI vs Grupo Mabi) foram mantidos como 2
 * pessoas distintas; uma linha vazia duplicada de "Thiago Bueno de Freitas"
 * foi descartada. Sobrou 123 confirmados unicos.
 *
 * Casamento com o que ja existe no banco por NOME NORMALIZADO (sem acento,
 * minusculo) + desempate por empresa quando ha mais de um attendee com o
 * mesmo nome (evita fundir "Rafael Coelho" da Grupo ROI com o da Grupo
 * Mabi, que sao pessoas diferentes) - so complementa campos vazios,
 * nunca sobrescreve dado real ja preenchido.
 */

type Row = {
  name: string;
  gender: string | null;
  focalPerson: string | null;
  category: string;
  ticketType: string | null;
  empresa: string | null;
  cpfRg: string | null;
  revenueRange: string | null;
  instagram: string | null;
  phone: string | null;
  email: string | null;
};

const ATTENDEES: Row[] = [
  {
    "name": "Ian Daniel Simão Agarelli",
    "gender": "Masculino",
    "focalPerson": "Karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Love and Comfy",
    "cpfRg": null,
    "revenueRange": "300 mil a 500 mil por mês",
    "instagram": "@loveandcomfy",
    "phone": "11990152768",
    "email": null
  },
  {
    "name": "Stephanie Rubio",
    "gender": "Feminino",
    "focalPerson": "Karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Beleza do Futuro",
    "cpfRg": "44180794837",
    "revenueRange": "300 mil a 500 mil por mês",
    "instagram": null,
    "phone": "11996910750",
    "email": null
  },
  {
    "name": "Thais Cardoso",
    "gender": "Feminino",
    "focalPerson": "Karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Lunzi",
    "cpfRg": null,
    "revenueRange": "300 mil a 500 mil por mês",
    "instagram": null,
    "phone": "66992366748",
    "email": null
  },
  {
    "name": "Anselmo Abijaude",
    "gender": "Masculino",
    "focalPerson": "Karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Sense Brasil",
    "cpfRg": "8.084.449.648,00",
    "revenueRange": "300 mil a 500 mil por mês",
    "instagram": "@sensebrasil",
    "phone": "3188817651",
    "email": null
  },
  {
    "name": "Ana Gabriela Bergamashi",
    "gender": "Feminino",
    "focalPerson": "Karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Must",
    "cpfRg": "8.536.983.680,00",
    "revenueRange": "300 mil a 500 mil por mês",
    "instagram": "@muitomust",
    "phone": "31995852302",
    "email": null
  },
  {
    "name": "Ana Clara Tomaz Morais",
    "gender": "Feminino",
    "focalPerson": "Karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Must",
    "cpfRg": "127.607.846-30",
    "revenueRange": "300 mil a 500 mil por mês",
    "instagram": "@muitomust",
    "phone": "31995852302",
    "email": null
  },
  {
    "name": "Eudis Demetrius Rodrigues",
    "gender": "Masculino",
    "focalPerson": "Karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Portent",
    "cpfRg": null,
    "revenueRange": "300 mil a 500 mil por mês",
    "instagram": "@portent.moda",
    "phone": "19996601090",
    "email": null
  },
  {
    "name": "Gabriela Santos",
    "gender": "Feminino",
    "focalPerson": "Karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Portent",
    "cpfRg": null,
    "revenueRange": "300 mil a 500 mil por mês",
    "instagram": "@portent.moda",
    "phone": "19996601090",
    "email": null
  },
  {
    "name": "Lucas Alexandre Machado Costa",
    "gender": "Masculino",
    "focalPerson": "Karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Sense Brasil",
    "cpfRg": "14791490530",
    "revenueRange": "300 mil a 500 mil por mês",
    "instagram": "@sensebrasil",
    "phone": "31997205622",
    "email": null
  },
  {
    "name": "Moacir Rosa",
    "gender": "Masculino",
    "focalPerson": "Karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Nutriage",
    "cpfRg": null,
    "revenueRange": "300 mil a 500 mil por mês",
    "instagram": "@nutriagesuplementos",
    "phone": "33991538881",
    "email": null
  },
  {
    "name": "Ana Carolina",
    "gender": "Feminino",
    "focalPerson": "Camila",
    "category": "membro_club",
    "ticketType": "VIP",
    "empresa": "Ilumina",
    "cpfRg": null,
    "revenueRange": null,
    "instagram": "@iluminabeaute",
    "phone": "54 9601-6583",
    "email": null
  },
  {
    "name": "Diego Rosignol",
    "gender": "Masculino",
    "focalPerson": "Camila",
    "category": "membro_club",
    "ticketType": "VIP",
    "empresa": "Ilumina",
    "cpfRg": "00452268060",
    "revenueRange": null,
    "instagram": "@iluminabeaute",
    "phone": "54 9156-2210",
    "email": null
  },
  {
    "name": "Cristian Gadelha",
    "gender": "Masculino",
    "focalPerson": "Camila",
    "category": "membro_club",
    "ticketType": "VIP",
    "empresa": "Souly",
    "cpfRg": null,
    "revenueRange": null,
    "instagram": "@souly.com.br",
    "phone": null,
    "email": null
  },
  {
    "name": "Mateus Kurek Pagliosa",
    "gender": "Masculino",
    "focalPerson": "Camila",
    "category": "membro_club",
    "ticketType": "VIP",
    "empresa": "Souly",
    "cpfRg": null,
    "revenueRange": null,
    "instagram": "@souly.com.br",
    "phone": null,
    "email": null
  },
  {
    "name": "Karine Auricchio",
    "gender": "Feminino",
    "focalPerson": "Camila",
    "category": "membro_tracao",
    "ticketType": "GOLD",
    "empresa": "Alloezil",
    "cpfRg": null,
    "revenueRange": null,
    "instagram": "@alloeoficial",
    "phone": null,
    "email": null
  },
  {
    "name": "Camila Auricchio",
    "gender": "Feminino",
    "focalPerson": "Camila",
    "category": "membro_tracao",
    "ticketType": "GOLD",
    "empresa": "Alloezil",
    "cpfRg": null,
    "revenueRange": null,
    "instagram": "@alloeoficial",
    "phone": null,
    "email": null
  },
  {
    "name": "Luis Filipe",
    "gender": "Masculino",
    "focalPerson": "Camila",
    "category": "membro_club",
    "ticketType": "VIP",
    "empresa": "Hiven",
    "cpfRg": null,
    "revenueRange": null,
    "instagram": "@hivencosmeticos",
    "phone": null,
    "email": null
  },
  {
    "name": "Deise Farkile",
    "gender": "Feminino",
    "focalPerson": "Camila",
    "category": "membro_club",
    "ticketType": "VIP",
    "empresa": "Hiven",
    "cpfRg": null,
    "revenueRange": null,
    "instagram": "@hivencosmeticos",
    "phone": null,
    "email": null
  },
  {
    "name": "Ygor Batista",
    "gender": "Masculino",
    "focalPerson": "Camila",
    "category": "membro_club",
    "ticketType": "VIP",
    "empresa": "Memora Digital",
    "cpfRg": "43279506883",
    "revenueRange": null,
    "instagram": "@memora.digital",
    "phone": "16 99322-8996",
    "email": null
  },
  {
    "name": "Karina Pazolini",
    "gender": "Feminino",
    "focalPerson": "Camila",
    "category": "membro_club",
    "ticketType": "VIP",
    "empresa": "Dolcii",
    "cpfRg": "30903213869",
    "revenueRange": null,
    "instagram": "@dolciibysocalcinhas",
    "phone": "47 99932‑0020‬",
    "email": null
  },
  {
    "name": "Douglas Pazolini",
    "gender": "Masculino",
    "focalPerson": "Camila",
    "category": "membro_club",
    "ticketType": "VIP",
    "empresa": "Dolcii",
    "cpfRg": null,
    "revenueRange": null,
    "instagram": "@dolciibysocalcinhas",
    "phone": "47 99932‑0010‬",
    "email": null
  },
  {
    "name": "Marcelo Pienna",
    "gender": "Masculino",
    "focalPerson": "Camila",
    "category": "membro_club",
    "ticketType": "VIP",
    "empresa": "Pienna Joias",
    "cpfRg": null,
    "revenueRange": null,
    "instagram": "@piennajoias",
    "phone": "51 8169-1959",
    "email": null
  },
  {
    "name": "Fernanda Locatelli",
    "gender": "Feminino",
    "focalPerson": "Camila",
    "category": "membro_club",
    "ticketType": "VIP",
    "empresa": "Pienna Joias",
    "cpfRg": null,
    "revenueRange": null,
    "instagram": "@piennajoias",
    "phone": "51 8521-5147",
    "email": null
  },
  {
    "name": "Alana Ely Pereira",
    "gender": "Feminino",
    "focalPerson": "Karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Pienna Joias",
    "cpfRg": null,
    "revenueRange": "301 mil a 500 mil por mês",
    "instagram": "@piennajoias",
    "phone": "51981691959",
    "email": null
  },
  {
    "name": "Victor Folha",
    "gender": "Masculino",
    "focalPerson": "Karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Zafira",
    "cpfRg": "39.033.200.805,00",
    "revenueRange": "Acima de 1 milhão por mês",
    "instagram": "@zafiraatacado",
    "phone": "1.19408E+11",
    "email": null
  },
  {
    "name": "Gabriela Zafira",
    "gender": "Feminino",
    "focalPerson": "Karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Zafira",
    "cpfRg": "49.889.116.839,00",
    "revenueRange": "Acima de 1 milhão por mês",
    "instagram": "@zafiraatacado",
    "phone": "1.19988E+11",
    "email": null
  },
  {
    "name": "Suelem Motozo Couto",
    "gender": "Feminino",
    "focalPerson": "Karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Zafira",
    "cpfRg": "39.214.033.886,00",
    "revenueRange": "Acima de 1 milhão por mês",
    "instagram": "@zafiraatacado",
    "phone": "11952248773",
    "email": null
  },
  {
    "name": "Ana Carolina Ramos",
    "gender": "Feminino",
    "focalPerson": "Karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Zafira",
    "cpfRg": "52.871.351.813,00",
    "revenueRange": "Acima de 1 milhão por mês",
    "instagram": "@zafiraatacado",
    "phone": "11984540313",
    "email": null
  },
  {
    "name": "Renata Piana",
    "gender": "Feminino",
    "focalPerson": "Karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Testo Monster",
    "cpfRg": null,
    "revenueRange": "Abaixo de 50 mil por mês",
    "instagram": "@testo_monster",
    "phone": "(49) 99981-4443",
    "email": null
  },
  {
    "name": "Fábio Bueno",
    "gender": "Masculino",
    "focalPerson": "Karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Bigens",
    "cpfRg": null,
    "revenueRange": "Acima de 1 milhão por mês",
    "instagram": "@bigens.com.br",
    "phone": "(11) 99392-2157",
    "email": null
  },
  {
    "name": "Jônatas Mesquita",
    "gender": "Masculino",
    "focalPerson": "Karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Nuture",
    "cpfRg": null,
    "revenueRange": "Acima de 1 milhão por mês",
    "instagram": "@nuture.com.br",
    "phone": "(11) 94840-5098",
    "email": null
  },
  {
    "name": "Paulo Stenghel",
    "gender": "Masculino",
    "focalPerson": "Karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Imperatriz",
    "cpfRg": null,
    "revenueRange": "Acima de 1 milhão por mês",
    "instagram": "@imperatrizcervejaria",
    "phone": "(15) 98114-8948",
    "email": null
  },
  {
    "name": "Maycon Mota",
    "gender": "Masculino",
    "focalPerson": "Karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Mariana Dias",
    "cpfRg": null,
    "revenueRange": "300 mil a 500 mil por mês",
    "instagram": "@marianadiasmd",
    "phone": "(48) 99811-2222",
    "email": null
  },
  {
    "name": "Nubia",
    "gender": "Feminino",
    "focalPerson": "Karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Lavie Jalecos",
    "cpfRg": null,
    "revenueRange": "300 mil a 500 mil por mês",
    "instagram": "@laviejalecos",
    "phone": "(62) 998778080",
    "email": null
  },
  {
    "name": "Maressa",
    "gender": "Feminino",
    "focalPerson": "Karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Lavie Jalecos",
    "cpfRg": null,
    "revenueRange": "300 mil a 500 mil por mês",
    "instagram": "@laviejalecos",
    "phone": "(62) 998778080",
    "email": null
  },
  {
    "name": "Áureo Calçado Barbosa",
    "gender": "Masculino",
    "focalPerson": "Karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Carolinababy Moveus Infantis",
    "cpfRg": null,
    "revenueRange": "Acima de 1 milhão por mês",
    "instagram": "@carilinababy",
    "phone": "(32) 99927-1055",
    "email": null
  },
  {
    "name": "Aline Sokolowski Morais",
    "gender": "Feminino",
    "focalPerson": "Karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Docsline",
    "cpfRg": null,
    "revenueRange": "Abaixo de 50 mil por mês",
    "instagram": "@docsline.ultrassom",
    "phone": "11981075772",
    "email": null
  },
  {
    "name": "Fernanda Joffe",
    "gender": "Feminino",
    "focalPerson": "Karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Claudia Menezzes",
    "cpfRg": "1.075.091.136,00",
    "revenueRange": "300 mil a 500 mil por mês",
    "instagram": "@claudiamenezzes.oficial",
    "phone": "62999530708",
    "email": null
  },
  {
    "name": "Fernando Matos",
    "gender": "Masculino",
    "focalPerson": "Igor",
    "category": "patrocinador",
    "ticketType": "VIP",
    "empresa": "Martz",
    "cpfRg": null,
    "revenueRange": null,
    "instagram": "@martzcrm",
    "phone": "37 99982-3239",
    "email": "contato@martz.com.br"
  },
  {
    "name": "Eduardo Salles Kavaliunas",
    "gender": "Masculino",
    "focalPerson": "Igor",
    "category": "patrocinador",
    "ticketType": "VIP",
    "empresa": "Martz",
    "cpfRg": null,
    "revenueRange": null,
    "instagram": "@martzcrm",
    "phone": "51 9366-9679",
    "email": "eduardo.salles@martz.com.br"
  },
  {
    "name": "Matheus Decco Kawamura",
    "gender": "Masculino",
    "focalPerson": "Igor",
    "category": "convidado_patrocinador",
    "ticketType": "GOLD",
    "empresa": "Widde",
    "cpfRg": "53.636.141-1",
    "revenueRange": null,
    "instagram": "@widde.io",
    "phone": "(11) 971780159",
    "email": "matheus.decco@widde.io"
  },
  {
    "name": "Bruna Meda",
    "gender": "Feminino",
    "focalPerson": "Igor",
    "category": "convidado_patrocinador",
    "ticketType": "GOLD",
    "empresa": "Flueshop e Amarra e Sai",
    "cpfRg": "39735600-6",
    "revenueRange": null,
    "instagram": "@flueshop / amarraesai",
    "phone": "11 998105407",
    "email": "Brunameda@gmail.com"
  },
  {
    "name": "Priscila Tiveron Ramalho",
    "gender": "Feminino",
    "focalPerson": "Igor",
    "category": "convidado_patrocinador",
    "ticketType": "GOLD",
    "empresa": "Amarra e Sai e Flueshop",
    "cpfRg": "43.972.278-0",
    "revenueRange": null,
    "instagram": "amarraesai / @flueshop",
    "phone": "11982817878",
    "email": "priscilativeron@gmail.com"
  },
  {
    "name": "Matheus Pacheco Corrêa de Oliveira",
    "gender": "Masculino",
    "focalPerson": "Igor",
    "category": "convidado_patrocinador",
    "ticketType": "GOLD",
    "empresa": "Zeno",
    "cpfRg": "59.844.651-5",
    "revenueRange": null,
    "instagram": "@zenoficial",
    "phone": "11 969101009",
    "email": "matheus@usezeno.com.br"
  },
  {
    "name": "Igor Garbi da Silva",
    "gender": "Masculino",
    "focalPerson": "Igor",
    "category": "convidado_patrocinador",
    "ticketType": "GOLD",
    "empresa": "Zeno",
    "cpfRg": "56.726.189-x",
    "revenueRange": null,
    "instagram": "@zenoficial",
    "phone": "11 948841290",
    "email": "igorgs2233@gmail.com"
  },
  {
    "name": "Bruno Borges",
    "gender": "Masculino",
    "focalPerson": "Igor",
    "category": "convidado_patrocinador",
    "ticketType": "GOLD",
    "empresa": "Martz",
    "cpfRg": "467.444.596,00",
    "revenueRange": null,
    "instagram": "@martzcrm",
    "phone": "11 99005-7934",
    "email": "brunoborgesnunes@gmail.com"
  },
  {
    "name": "Tamires Vieira Borges",
    "gender": "Feminino",
    "focalPerson": "Igor",
    "category": "convidado_patrocinador",
    "ticketType": "GOLD",
    "empresa": "Martz",
    "cpfRg": "452.008.803,00",
    "revenueRange": null,
    "instagram": "@martzcrm",
    "phone": "11 993582163",
    "email": "tamires_vieira10@hotmail.com"
  },
  {
    "name": "Renato Vieira Arouck",
    "gender": "Masculino",
    "focalPerson": "Igor",
    "category": "convidado_patrocinador",
    "ticketType": "GOLD",
    "empresa": "Martz",
    "cpfRg": "503.065.353,00",
    "revenueRange": null,
    "instagram": "@martzcrm",
    "phone": "11 951680813",
    "email": "revieira.rv29@gmail.com"
  },
  {
    "name": "Vitória Silva de Lima",
    "gender": "Feminino",
    "focalPerson": "Igor",
    "category": "convidado_patrocinador",
    "ticketType": "GOLD",
    "empresa": "Martz",
    "cpfRg": "66.994.439-7",
    "revenueRange": null,
    "instagram": "@martzcrm",
    "phone": "11947611098",
    "email": "vitorialima210407@gmail.com"
  },
  {
    "name": "Natana Stinguel",
    "gender": "Feminino",
    "focalPerson": "Igor",
    "category": "convidado_patrocinador",
    "ticketType": "GOLD",
    "empresa": "Use Natana Stinguel",
    "cpfRg": "483.003.165,00",
    "revenueRange": null,
    "instagram": "@usenatanastinguel",
    "phone": "11 97980-0405",
    "email": "adm@natanastinguel.com"
  },
  {
    "name": "Felipe Barros",
    "gender": "Feminino",
    "focalPerson": "Karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Mundo Nina",
    "cpfRg": null,
    "revenueRange": "300 mil a 500 mil por mês",
    "instagram": "@mundonina.kids",
    "phone": "(19) 98125-7287",
    "email": null
  },
  {
    "name": "Paulo Alves",
    "gender": "Feminino",
    "focalPerson": "Karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Mundo Nina",
    "cpfRg": null,
    "revenueRange": "300 mil a 500 mil por mês",
    "instagram": "@mundoninakids",
    "phone": "(11) 98558-9737",
    "email": null
  },
  {
    "name": "Alexandre Costa Alvino",
    "gender": "Masculino",
    "focalPerson": "Igor",
    "category": "convidado_patrocinador",
    "ticketType": "GOLD",
    "empresa": "WeupMkt",
    "cpfRg": "2.527.766,00",
    "revenueRange": null,
    "instagram": null,
    "phone": "67 9 9664-2687",
    "email": null
  },
  {
    "name": "Lucas Scheuer",
    "gender": "Masculino",
    "focalPerson": "Igor",
    "category": "patrocinador",
    "ticketType": "VIP",
    "empresa": "CFO Company",
    "cpfRg": "5.128.177,00",
    "revenueRange": null,
    "instagram": null,
    "phone": "(48) 98405-6903",
    "email": "lucas@cfocompany.com.br"
  },
  {
    "name": "Marcio Dias",
    "gender": "Masculino",
    "focalPerson": "Igor",
    "category": "patrocinador",
    "ticketType": "VIP",
    "empresa": "CFO Company",
    "cpfRg": "6.055.776,00",
    "revenueRange": null,
    "instagram": null,
    "phone": "(48) 98835-9055",
    "email": "marcio@cfocompany.com.br"
  },
  {
    "name": "Jorge Luis Costa de Andrade",
    "gender": "Masculino",
    "focalPerson": "Igor",
    "category": "patrocinador",
    "ticketType": "VIP",
    "empresa": "Yampi",
    "cpfRg": "4.686.204.194,00",
    "revenueRange": null,
    "instagram": null,
    "phone": "91 9214-8793",
    "email": "jorge@techecom.com.br"
  },
  {
    "name": "Ingrid Simões Batista",
    "gender": "Feminino",
    "focalPerson": "Igor",
    "category": "patrocinador",
    "ticketType": "VIP",
    "empresa": "Yampi",
    "cpfRg": "160.505.677-43",
    "revenueRange": null,
    "instagram": null,
    "phone": "21999925456",
    "email": "ingrid.simoes@yampi.com.br"
  },
  {
    "name": "Henrique Sanches Andrade",
    "gender": "Masculino",
    "focalPerson": "Igor",
    "category": "patrocinador",
    "ticketType": "VIP",
    "empresa": "Yampi",
    "cpfRg": "40.960.929.835,00",
    "revenueRange": null,
    "instagram": null,
    "phone": "119 9877-0602",
    "email": "henrique.andrade@yampi.com.br"
  },
  {
    "name": "Guilherme Martins",
    "gender": "Masculino",
    "focalPerson": "Karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Eitri",
    "cpfRg": null,
    "revenueRange": "500 mil a 1 milhão por mês",
    "instagram": "@eitri.tech",
    "phone": "(21) 98183-6529",
    "email": null
  },
  {
    "name": "Vinicius Nastri",
    "gender": "Masculino",
    "focalPerson": "Karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Eitri",
    "cpfRg": null,
    "revenueRange": "500 mil a 1 milhão por mês",
    "instagram": "@eitritech",
    "phone": "(11) 97287-5459",
    "email": null
  },
  {
    "name": "Thiago Falanga",
    "gender": "Masculino",
    "focalPerson": "Karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Eitri",
    "cpfRg": null,
    "revenueRange": "500 mil a 1 milhão por mês",
    "instagram": "@Eitritech",
    "phone": "(11) 99130-6354",
    "email": null
  },
  {
    "name": "Angela Vitalino de Farias",
    "gender": "Feminino",
    "focalPerson": "Camila",
    "category": "membro_club",
    "ticketType": "VIP",
    "empresa": "Bambbu Cosmeticos Ind. e Com. Ltda - ME",
    "cpfRg": null,
    "revenueRange": "100 mil a 300 mil por mês",
    "instagram": "@bambbucosmeticos",
    "phone": "(11) 95195-2688",
    "email": null
  },
  {
    "name": "Luiz Antonio de Farias",
    "gender": "Masculino",
    "focalPerson": "Camila",
    "category": "membro_club",
    "ticketType": "VIP",
    "empresa": "Bambbu Cosmeticos Ind. e Com. Ltda - ME",
    "cpfRg": "17343556894",
    "revenueRange": "100 mil a 300 mil por mês",
    "instagram": "@cabelosbrancosegrisalhos.blog",
    "phone": "(11) 99550-3990",
    "email": null
  },
  {
    "name": "Phelipe Emerenciano Nunes dos Santos",
    "gender": "Masculino",
    "focalPerson": "Igor",
    "category": "convidado_patrocinador",
    "ticketType": "VIP",
    "empresa": "Filip Joias",
    "cpfRg": "43.183.871.866,00",
    "revenueRange": null,
    "instagram": "@filipjoias",
    "phone": "11984028483",
    "email": "phelipeemerenciano@gmail.com"
  },
  {
    "name": "Fernanda Ximenes de Andrade",
    "gender": "Feminino",
    "focalPerson": "Igor",
    "category": "convidado_patrocinador",
    "ticketType": "VIP",
    "empresa": "Dailus",
    "cpfRg": "417.722.718-88",
    "revenueRange": null,
    "instagram": "@dailus",
    "phone": "11 98373-6854",
    "email": "fernanda.andrade@grupodailus.com.br"
  },
  {
    "name": "Luiza Sell Souto Goulart",
    "gender": "Feminino",
    "focalPerson": "Camila",
    "category": "membro_club",
    "ticketType": "VIP",
    "empresa": "Livvan",
    "cpfRg": null,
    "revenueRange": null,
    "instagram": null,
    "phone": "47 99691-1117",
    "email": null
  },
  {
    "name": "Marcus Dutra",
    "gender": "Masculino",
    "focalPerson": "Camila",
    "category": "membro_club",
    "ticketType": "VIP",
    "empresa": "Strongest",
    "cpfRg": null,
    "revenueRange": null,
    "instagram": null,
    "phone": "14 98118‑8850‬",
    "email": null
  },
  {
    "name": "Nathan de Castro",
    "gender": "Masculino",
    "focalPerson": "Camila",
    "category": "membro_tracao",
    "ticketType": "GOLD",
    "empresa": "DIVN",
    "cpfRg": null,
    "revenueRange": null,
    "instagram": null,
    "phone": "27 98173-3601",
    "email": null
  },
  {
    "name": "Gabriel Pedro",
    "gender": "Masculino",
    "focalPerson": "Camila",
    "category": "membro_club",
    "ticketType": "VIP",
    "empresa": "Colup | MR Carvalho",
    "cpfRg": "485.558.318-90",
    "revenueRange": null,
    "instagram": null,
    "phone": "19 98312-0725",
    "email": null
  },
  {
    "name": "EDUARDO BIDESE",
    "gender": "Masculino",
    "focalPerson": "karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Altia Group",
    "cpfRg": null,
    "revenueRange": "50 mil a 100 mil por mês",
    "instagram": "@biidese",
    "phone": "(54) 99129-1559",
    "email": null
  },
  {
    "name": "Pyong Lee",
    "gender": "Masculino",
    "focalPerson": "karina",
    "category": "membro_club",
    "ticketType": "VIP",
    "empresa": "De Nada",
    "cpfRg": null,
    "revenueRange": "Abaixo de 50 mil por mês",
    "instagram": "@denada.com.br",
    "phone": "(11) 95282-2411",
    "email": null
  },
  {
    "name": "Natália Nasser",
    "gender": "Feminino",
    "focalPerson": "karina",
    "category": "membro_club",
    "ticketType": "VIP",
    "empresa": "De Nada",
    "cpfRg": null,
    "revenueRange": "Abaixo de 50 mil por mês",
    "instagram": "@denada.com.br",
    "phone": "(11) 97601-0330",
    "email": null
  },
  {
    "name": "Wanderson de Melo Silva",
    "gender": "Masculino",
    "focalPerson": "karina",
    "category": "membro_club",
    "ticketType": "VIP",
    "empresa": "Omnia CO",
    "cpfRg": null,
    "revenueRange": null,
    "instagram": "@omniaco",
    "phone": null,
    "email": null
  },
  {
    "name": "Tomé Marcos",
    "gender": "Masculino",
    "focalPerson": "Igor",
    "category": "patrocinador",
    "ticketType": "VIP",
    "empresa": "Grupo ROI",
    "cpfRg": "18829589 SSPMG",
    "revenueRange": null,
    "instagram": null,
    "phone": "31 996356040",
    "email": "tome@roiventures.com.br"
  },
  {
    "name": "Marco Tulio",
    "gender": "Masculino",
    "focalPerson": "Igor",
    "category": "patrocinador",
    "ticketType": "VIP",
    "empresa": "Grupo ROI",
    "cpfRg": "17266859 SSPMG",
    "revenueRange": null,
    "instagram": null,
    "phone": "31 983991247",
    "email": "marcao@roiventures.com.br"
  },
  {
    "name": "Rafael Coelho",
    "gender": "Masculino",
    "focalPerson": "Igor",
    "category": "patrocinador",
    "ticketType": "VIP",
    "empresa": "Grupo ROI",
    "cpfRg": null,
    "revenueRange": null,
    "instagram": null,
    "phone": "31993530500",
    "email": "coelho@roiventures.com.br"
  },
  {
    "name": "Rafael Coelho",
    "gender": "Masculino",
    "focalPerson": "karina",
    "category": "pagante",
    "ticketType": "VIP",
    "empresa": "Grupo Mabi",
    "cpfRg": null,
    "revenueRange": null,
    "instagram": null,
    "phone": null,
    "email": null
  },
  {
    "name": "Lucas Motta",
    "gender": "Masculino",
    "focalPerson": "Igor",
    "category": "patrocinador",
    "ticketType": "VIP",
    "empresa": "Grupo ROI",
    "cpfRg": "14291837 SSPMG",
    "revenueRange": null,
    "instagram": null,
    "phone": "31993113132",
    "email": "lucas@roiventeures.com.br"
  },
  {
    "name": "Henrique Oliveira",
    "gender": "Masculino",
    "focalPerson": "igor",
    "category": "convidado_patrocinador",
    "ticketType": "VIP",
    "empresa": "Stock Importadora",
    "cpfRg": null,
    "revenueRange": null,
    "instagram": null,
    "phone": "31994923921",
    "email": null
  },
  {
    "name": "Marcus Ferreira",
    "gender": "Masculino",
    "focalPerson": "igor",
    "category": "equipe_interna",
    "ticketType": "GOLD",
    "empresa": "Brand Legacy",
    "cpfRg": "385.945.632,00",
    "revenueRange": null,
    "instagram": null,
    "phone": null,
    "email": null
  },
  {
    "name": "Marcelo Kyu Ho Kim",
    "gender": "Masculino",
    "focalPerson": "karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Z2 Performance",
    "cpfRg": null,
    "revenueRange": "Acima de 1 milhão por mês",
    "instagram": null,
    "phone": null,
    "email": null
  },
  {
    "name": "Gustavo Vertelo",
    "gender": "Masculino",
    "focalPerson": "karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Dom Pagamentos",
    "cpfRg": null,
    "revenueRange": "Acima de 1 milhão por mês",
    "instagram": null,
    "phone": null,
    "email": null
  },
  {
    "name": "James Russell",
    "gender": "Masculino",
    "focalPerson": "karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Spas Versati - Purafiltra",
    "cpfRg": "6.848.903.809,00",
    "revenueRange": "300 mil a 500 mil por mês",
    "instagram": null,
    "phone": null,
    "email": null
  },
  {
    "name": "Gabriel Alves",
    "gender": "Masculino",
    "focalPerson": "karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Snugg",
    "cpfRg": null,
    "revenueRange": "100 mil a 300 mil por mês",
    "instagram": null,
    "phone": null,
    "email": null
  },
  {
    "name": "James Alec Esper",
    "gender": "Masculino",
    "focalPerson": "karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Spas Versati - Purafiltra",
    "cpfRg": "52.964.162.875,00",
    "revenueRange": "300 mil a 500 mil por mês",
    "instagram": null,
    "phone": null,
    "email": null
  },
  {
    "name": "Karina Irffi de Melo",
    "gender": "Feminino",
    "focalPerson": "karina",
    "category": "equipe_interna",
    "ticketType": "GOLD",
    "empresa": "-",
    "cpfRg": null,
    "revenueRange": null,
    "instagram": null,
    "phone": null,
    "email": null
  },
  {
    "name": "Lucar Carvalho",
    "gender": "Masculino",
    "focalPerson": "karina",
    "category": "equipe_interna",
    "ticketType": "GOLD",
    "empresa": "-",
    "cpfRg": null,
    "revenueRange": null,
    "instagram": null,
    "phone": null,
    "email": null
  },
  {
    "name": "Fabiano Oliveira Lopes",
    "gender": "Masculino",
    "focalPerson": "karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Auren nutrition",
    "cpfRg": "1.749.553.244,00",
    "revenueRange": "300 mil a 500 mil por mês",
    "instagram": null,
    "phone": null,
    "email": null
  },
  {
    "name": "Renato Estende Ramos",
    "gender": "Masculino",
    "focalPerson": "Camila",
    "category": "membro_club",
    "ticketType": "VIP",
    "empresa": "Nappô",
    "cpfRg": "346.931.988-03",
    "revenueRange": null,
    "instagram": null,
    "phone": "11 95843-3492",
    "email": null
  },
  {
    "name": "Letícia Albuquerque",
    "gender": "Feminino",
    "focalPerson": "Camila",
    "category": "membro_club",
    "ticketType": "VIP",
    "empresa": "Nappô",
    "cpfRg": "470.170.348-64",
    "revenueRange": null,
    "instagram": null,
    "phone": "11 97244-3458",
    "email": null
  },
  {
    "name": "Octávio Galhardi",
    "gender": "Masculino",
    "focalPerson": "Camila",
    "category": "membro_club",
    "ticketType": "VIP",
    "empresa": "Orgânica",
    "cpfRg": null,
    "revenueRange": null,
    "instagram": null,
    "phone": "11 99327-0935",
    "email": null
  },
  {
    "name": "João Galhardi",
    "gender": "Masculino",
    "focalPerson": "Camila",
    "category": "membro_club",
    "ticketType": "VIP",
    "empresa": "Orgânica",
    "cpfRg": null,
    "revenueRange": null,
    "instagram": null,
    "phone": "11 99410‑8052‬",
    "email": null
  },
  {
    "name": "Felipe Lima",
    "gender": "Masculino",
    "focalPerson": "Camila",
    "category": "membro_club",
    "ticketType": "VIP",
    "empresa": "Orgânica",
    "cpfRg": "41845309820",
    "revenueRange": null,
    "instagram": null,
    "phone": "11 96498-1761",
    "email": null
  },
  {
    "name": "Maria Carolina Ducci Nali Souza",
    "gender": "Feminino",
    "focalPerson": "karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "@carolducci_nali",
    "cpfRg": "312.180.988-13",
    "revenueRange": null,
    "instagram": null,
    "phone": null,
    "email": null
  },
  {
    "name": "Gabriel Klein Pereira",
    "gender": "Masculino",
    "focalPerson": "Camila",
    "category": "membro_club",
    "ticketType": "VIP",
    "empresa": "Colup | MR Carvalho",
    "cpfRg": "135.415.646-36",
    "revenueRange": null,
    "instagram": null,
    "phone": "35 99830‑2467",
    "email": null
  },
  {
    "name": "Felipe Belele",
    "gender": "Masculino",
    "focalPerson": "Camila",
    "category": "membro_club",
    "ticketType": "VIP",
    "empresa": "Ocean Drop",
    "cpfRg": null,
    "revenueRange": null,
    "instagram": null,
    "phone": "11 98586-9787",
    "email": null
  },
  {
    "name": "Luisa Shell",
    "gender": null,
    "focalPerson": null,
    "category": "pagante",
    "ticketType": null,
    "empresa": null,
    "cpfRg": null,
    "revenueRange": null,
    "instagram": null,
    "phone": null,
    "email": null
  },
  {
    "name": "Ariane Krause",
    "gender": "Feminino",
    "focalPerson": "Igor",
    "category": "convidado_socio",
    "ticketType": "GOLD",
    "empresa": "Bisyou",
    "cpfRg": "03630983057",
    "revenueRange": null,
    "instagram": null,
    "phone": "11 989351295",
    "email": "arianekrause95@gmail.com"
  },
  {
    "name": "Camilla de Souza Barro",
    "gender": "Feminino",
    "focalPerson": "Igor",
    "category": "convidado_patrocinador",
    "ticketType": "GOLD",
    "empresa": "TPL",
    "cpfRg": "343721238-92",
    "revenueRange": null,
    "instagram": null,
    "phone": "(11) 93205-6820",
    "email": "camilla.souza@tpl.com.br"
  },
  {
    "name": "Anderson Freitas Silva",
    "gender": "Masculino",
    "focalPerson": "Igor",
    "category": "convidado_patrocinador",
    "ticketType": "GOLD",
    "empresa": "TPL",
    "cpfRg": "099605847-80",
    "revenueRange": null,
    "instagram": null,
    "phone": "(21) 99746-1262",
    "email": "anderson.freitas@tpl.com.br"
  },
  {
    "name": "Ana Carolina da Conceição de Souza",
    "gender": "Feminino",
    "focalPerson": "Igor",
    "category": "convidado_patrocinador",
    "ticketType": "GOLD",
    "empresa": "TPL",
    "cpfRg": "412139098-99",
    "revenueRange": null,
    "instagram": null,
    "phone": "(11) 96562-6942",
    "email": "anacarolina.souza@tpl.com.br"
  },
  {
    "name": "Gabriel Chabuh",
    "gender": "Masculino",
    "focalPerson": "Igor",
    "category": "convidado_patrocinador",
    "ticketType": "VIP",
    "empresa": "TPL",
    "cpfRg": "472043858-02",
    "revenueRange": null,
    "instagram": null,
    "phone": "11 97623-5719",
    "email": "gabriel.chabuh@tpl.com.br"
  },
  {
    "name": "Robson Lima de Jesus",
    "gender": "Masculino",
    "focalPerson": "Igor",
    "category": "convidado_patrocinador",
    "ticketType": "GOLD",
    "empresa": "TPL",
    "cpfRg": "402553998-55",
    "revenueRange": null,
    "instagram": null,
    "phone": "(11) 99116-8831",
    "email": "robson.lima@tpl.com.br"
  },
  {
    "name": "Thiago Bueno de Freitas",
    "gender": "Masculino",
    "focalPerson": "Igor",
    "category": "convidado_patrocinador",
    "ticketType": "VIP",
    "empresa": "TPL",
    "cpfRg": "346019348-42",
    "revenueRange": null,
    "instagram": null,
    "phone": "(11) 96671-1160",
    "email": "thiago.bueno@tpl.com.br"
  },
  {
    "name": "Giovana Anjos",
    "gender": "Masculino",
    "focalPerson": "Igor",
    "category": "convidado_patrocinador",
    "ticketType": "GOLD",
    "empresa": "TPL",
    "cpfRg": "497881588-62",
    "revenueRange": null,
    "instagram": null,
    "phone": "(11) 95779-0582",
    "email": "giovana.anjos@tpl.com.br"
  },
  {
    "name": "Marcelo Terrazan",
    "gender": "Masculino",
    "focalPerson": "Igor",
    "category": "patrocinador",
    "ticketType": "VIP",
    "empresa": "TPL",
    "cpfRg": "328.261.998-70",
    "revenueRange": null,
    "instagram": null,
    "phone": null,
    "email": "Marcelo.terrazan@tpl.com.br"
  },
  {
    "name": "Carina Oliveira",
    "gender": "Feminino",
    "focalPerson": "Igor",
    "category": "patrocinador",
    "ticketType": "VIP",
    "empresa": "TPL",
    "cpfRg": null,
    "revenueRange": null,
    "instagram": null,
    "phone": null,
    "email": "carina.oliveira@tpl.com.br"
  },
  {
    "name": "Fernanda Fiumarelli Maneta",
    "gender": "Feminino",
    "focalPerson": "Igor",
    "category": "convidado_patrocinador",
    "ticketType": "GOLD",
    "empresa": "Bebê Algodão",
    "cpfRg": "43.548.775-9",
    "revenueRange": null,
    "instagram": null,
    "phone": "11 992839562",
    "email": "fernandafmaneta@yahoo.com.br"
  },
  {
    "name": "Janaina Leandro",
    "gender": "Feminino",
    "focalPerson": "Igor",
    "category": "patrocinador",
    "ticketType": "VIP",
    "empresa": "Galucci",
    "cpfRg": "41607472-8",
    "revenueRange": null,
    "instagram": null,
    "phone": "11 91926239",
    "email": "janaina.leandro@galucci.srvr.br"
  },
  {
    "name": "Fernando Galucci",
    "gender": "Masculino",
    "focalPerson": "Igor",
    "category": "patrocinador",
    "ticketType": "VIP",
    "empresa": "Galucci",
    "cpfRg": "32745287818",
    "revenueRange": null,
    "instagram": null,
    "phone": "11 99194-9463",
    "email": "fernando@galucci.srv.br"
  },
  {
    "name": "Nathalia de Sá",
    "gender": "Feminino",
    "focalPerson": "Igor",
    "category": "patrocinador",
    "ticketType": "VIP",
    "empresa": "Inbazz",
    "cpfRg": "3.721.545",
    "revenueRange": null,
    "instagram": null,
    "phone": null,
    "email": "ndesa@inbazz.com.br"
  },
  {
    "name": "Matheus Barcelos",
    "gender": "Masculino",
    "focalPerson": "Igor",
    "category": "patrocinador",
    "ticketType": "VIP",
    "empresa": "Inbazz",
    "cpfRg": "3325244 ES",
    "revenueRange": null,
    "instagram": null,
    "phone": "11 93619-7985",
    "email": "mbarcelos@inbazz.com.br"
  },
  {
    "name": "Adriane Alarcon Lisa",
    "gender": "Feminino",
    "focalPerson": "Igor",
    "category": "convidado_socio",
    "ticketType": "GOLD",
    "empresa": "Affecto Joias",
    "cpfRg": "427.422.178-43",
    "revenueRange": null,
    "instagram": null,
    "phone": "11975220916",
    "email": "Adriane_lisa@hotmail.com"
  },
  {
    "name": "Thais Moara",
    "gender": "Feminino",
    "focalPerson": "Igor",
    "category": "convidado_socio",
    "ticketType": "GOLD",
    "empresa": "Affecto Joias",
    "cpfRg": "38083182877",
    "revenueRange": null,
    "instagram": null,
    "phone": "11974487976",
    "email": null
  },
  {
    "name": "Iago Lolobrigida",
    "gender": "Masculino",
    "focalPerson": "Camila",
    "category": "membro_club",
    "ticketType": "VIP",
    "empresa": "Arcane",
    "cpfRg": "08205927650",
    "revenueRange": null,
    "instagram": null,
    "phone": "35 99805-1667",
    "email": null
  },
  {
    "name": "Ronaldo Haberly",
    "gender": "Masculino",
    "focalPerson": "Camila",
    "category": "membro_tracao",
    "ticketType": "GOLD",
    "empresa": "Aloezzil",
    "cpfRg": "284.688.178-21",
    "revenueRange": null,
    "instagram": null,
    "phone": "11 99188-0091",
    "email": null
  },
  {
    "name": "Angela Farias",
    "gender": "Feminino",
    "focalPerson": "Camila",
    "category": "membro_club",
    "ticketType": "VIP",
    "empresa": "Bambbu Cosmeticos",
    "cpfRg": null,
    "revenueRange": null,
    "instagram": null,
    "phone": "11 95195-2688",
    "email": "Ronaldo.rhp.rhp@gmail.com"
  },
  {
    "name": "Anamelia Sousa",
    "gender": "Feminino",
    "focalPerson": "Camila",
    "category": "membro_club",
    "ticketType": "VIP",
    "empresa": "ProHair",
    "cpfRg": null,
    "revenueRange": null,
    "instagram": null,
    "phone": null,
    "email": null
  },
  {
    "name": "Rodrigo Amaral",
    "gender": "Masculino",
    "focalPerson": "Camila",
    "category": "membro_club",
    "ticketType": "VIP",
    "empresa": "ProHair",
    "cpfRg": "31790689886",
    "revenueRange": null,
    "instagram": null,
    "phone": "11995751919",
    "email": null
  },
  {
    "name": "Derick",
    "gender": "Masculino",
    "focalPerson": "Camila",
    "category": "membro_club",
    "ticketType": "VIP",
    "empresa": "ProHair",
    "cpfRg": null,
    "revenueRange": null,
    "instagram": null,
    "phone": "11956184694",
    "email": null
  },
  {
    "name": "Caio Cesar Fertonani",
    "gender": "Masculino",
    "focalPerson": "karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Beleza do Futuro",
    "cpfRg": "4434258802",
    "revenueRange": null,
    "instagram": null,
    "phone": null,
    "email": null
  },
  {
    "name": "Patricia Pintor",
    "gender": "Feminino",
    "focalPerson": "karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "SpaVersati",
    "cpfRg": null,
    "revenueRange": null,
    "instagram": null,
    "phone": null,
    "email": null
  },
  {
    "name": "Lucas Anversa Lopes",
    "gender": "Masculino",
    "focalPerson": "karina",
    "category": "pagante",
    "ticketType": "GOLD",
    "empresa": "Lunzi",
    "cpfRg": "03942005000",
    "revenueRange": null,
    "instagram": null,
    "phone": null,
    "email": null
  }
];

function normalize(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function companiesCompatible(a: string, b: string): boolean {
  if (!a || !b) return true;
  if (a === b) return true;
  return a.includes(b) || b.includes(a);
}

export async function POST() {
  const user = await requireUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  const event = await prisma.event.findFirst({
    where: { name: { contains: "Setembro" } },
    orderBy: { startDate: "desc" },
  });
  if (!event) return NextResponse.json({ error: "Evento nao encontrado." }, { status: 404 });

  const existing = await prisma.eventAttendee.findMany({ where: { eventId: event.id } });
  const byNormName = new Map<string, typeof existing>();
  for (const a of existing) {
    const key = normalize(a.name);
    if (!byNormName.has(key)) byNormName.set(key, []);
    byNormName.get(key)!.push(a);
  }

  const results: { name: string; action: "created" | "updated"; id: string }[] = [];

  for (const row of ATTENDEES) {
    const candidates = byNormName.get(normalize(row.name)) ?? [];
    // Entre candidatos com o mesmo nome, so casa se a empresa for
    // compativel (igual, uma vazia, ou uma contem a outra) - senao sao
    // pessoas diferentes com o mesmo nome.
    const existingMatch = candidates.find((c) => companiesCompatible(normalize(c.empresa), normalize(row.empresa)));

    if (existingMatch) {
      await prisma.eventAttendee.update({
        where: { id: existingMatch.id },
        data: {
          gender: existingMatch.gender ?? row.gender,
          focalPerson: existingMatch.focalPerson ?? row.focalPerson,
          ticketType: existingMatch.ticketType ?? row.ticketType,
          empresa: existingMatch.empresa ?? row.empresa,
          cpfRg: existingMatch.cpfRg ?? row.cpfRg,
          revenueRange: existingMatch.revenueRange ?? row.revenueRange,
          instagram: existingMatch.instagram ?? row.instagram,
          phone: existingMatch.phone ?? row.phone,
          email: existingMatch.email ?? row.email,
        },
      });
      results.push({ name: row.name, action: "updated", id: existingMatch.id });
    } else {
      const created = await prisma.eventAttendee.create({
        data: {
          eventId: event.id,
          name: row.name,
          gender: row.gender,
          focalPerson: row.focalPerson,
          category: row.category as AttendeeCategory,
          ticketType: row.ticketType,
          empresa: row.empresa,
          cpfRg: row.cpfRg,
          revenueRange: row.revenueRange,
          instagram: row.instagram,
          phone: row.phone,
          email: row.email,
        },
      });
      results.push({ name: row.name, action: "created", id: created.id });
      // registra o novo attendee no mapa pra nao criar 2x se a planilha
      // repetir o mesmo nome de novo depois (ex.: Rafael Coelho da Mabi)
      const key = normalize(row.name);
      if (!byNormName.has(key)) byNormName.set(key, []);
      byNormName.get(key)!.push(created);
    }
  }

  const finalCount = await prisma.eventAttendee.count({ where: { eventId: event.id } });

  return NextResponse.json({
    results,
    created: results.filter((r) => r.action === "created").length,
    updated: results.filter((r) => r.action === "updated").length,
    finalCount,
  });
}
