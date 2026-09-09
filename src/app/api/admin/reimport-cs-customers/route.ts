import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import type { CustomerStatus } from "@prisma/client";

/**
 * Rota temporaria — apaga TODOS os Customer existentes e reimporta do zero
 * a partir de "PAINEL DE CONTROLE MENTORADOS _ CLUB E TRAÇÃO (3).xlsx"
 * (abas CLUB + TRAÇÃO como fonte primaria, PAINEL DE CONTROLE CLUB como
 * complemento só para marcas que não aparecem em CLUB/TRAÇÃO — em geral
 * clientes já encerrados/inativos mantidos ali por historico).
 *
 * Instrucao explicita do usuario: "Na parte de CS, apague o dado passado e
 * considere somente a planilha que eu te enviei" — excecao deliberada ao
 * padrao geral de "nao duplicar, so atualizar" usado no resto do sistema.
 */

type MeetingRow = { label: string; sequence: number; date: string };

type CustomerRow = {
  name: string;
  company: string | null;
  product: string;
  csName: string | null;
  entryDate: string;
  renewalDate: string | null;
  status: string;
  contractValue: number | null;
  lastContactAt: string | null;
  nextContactAt: string | null;
  notes: string | null;
  meetings: MeetingRow[];
};

const CS_EMAIL_MAP: Record<string, string> = {
  "camila leite": "camila.leite@brandlegacy.com.br",
  "alessandra dias": "alessandra.siqueira@brandlegacy.com.br",
  "giordana konrath": "giordana.konrath@brandlegacy.com.br",
};

function normalize(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const CUSTOMERS: CustomerRow[] = [
  {
    "name": "Amanda",
    "company": "Amanda | Pethelp",
    "product": "Club",
    "csName": "Camila Leite",
    "entryDate": "2026-05-12T00:00:00.000Z",
    "renewalDate": "2027-05-12T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 100000,
    "lastContactAt": "2026-07-10T00:00:00.000Z",
    "nextContactAt": "2026-07-17T00:00:00.000Z",
    "notes": "E-mail: amandalmedeiros@hotmail.com | Telefone: 81 99660-8700 | Segmento: Veterinário | Valor renovação: R$ 50000",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2026-05-15T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2026-05-28T00:00:00.000Z"
      },
      {
        "label": "Mentoria 3",
        "sequence": 3,
        "date": "2026-06-04T00:00:00.000Z"
      },
      {
        "label": "Mentoria 4",
        "sequence": 4,
        "date": "2026-06-05T00:00:00.000Z"
      },
      {
        "label": "Mentoria 5",
        "sequence": 5,
        "date": "2026-06-18T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "João Gabriel",
    "company": "Anagrow",
    "product": "Club",
    "csName": "Camila Leite",
    "entryDate": "2025-08-09T00:00:00.000Z",
    "renewalDate": "2026-08-09T00:00:00.000Z",
    "status": "cancelado",
    "contractValue": 99000,
    "lastContactAt": "2026-07-10T00:00:00.000Z",
    "nextContactAt": "2026-07-17T00:00:00.000Z",
    "notes": "E-mail: drjoaogabrielfernandes@gmail.com | Telefone: 11 98302-5128 | Segmento: Suplemento capilar | Valor renovação: R$ 49500 | Não renovou (escolha do Dom pela não renovação) | Satisfação: Insatisfeito | \"Depois da última imersão vejo que o propósito do programa está desalinhado com questões que acredito. Então perdi a vontade de participar\"",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2025-09-09T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2025-12-19T00:00:00.000Z"
      },
      {
        "label": "Mentoria 3",
        "sequence": 3,
        "date": "2025-10-08T00:00:00.000Z"
      },
      {
        "label": "Mentoria 4",
        "sequence": 4,
        "date": "2025-10-22T00:00:00.000Z"
      },
      {
        "label": "Mentoria 5",
        "sequence": 5,
        "date": "2025-12-22T00:00:00.000Z"
      },
      {
        "label": "Mentoria 6",
        "sequence": 6,
        "date": "2025-02-12T00:00:00.000Z"
      },
      {
        "label": "Mentoria 7",
        "sequence": 7,
        "date": "2026-04-13T00:00:00.000Z"
      },
      {
        "label": "Mentoria 8",
        "sequence": 8,
        "date": "2026-06-17T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Matheus",
    "company": "Aurha",
    "product": "Club",
    "csName": "Alessandra Dias",
    "entryDate": "2025-08-09T00:00:00.000Z",
    "renewalDate": "2026-08-09T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 116400,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": "E-mail: matheus@aurha.com.br | Telefone: 31 982461539 | Segmento: Acessórios focados em espiritualidade e bem-estar | Valor renovação: R$ 58200 | CS FAZER CONTATO PARA REUNIÃO DE ACOMPANHAMENTO",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2025-08-20T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2025-09-10T00:00:00.000Z"
      },
      {
        "label": "Mentoria 3",
        "sequence": 3,
        "date": "2025-09-19T00:00:00.000Z"
      },
      {
        "label": "Mentoria 4",
        "sequence": 4,
        "date": "2025-10-14T00:00:00.000Z"
      },
      {
        "label": "Mentoria 5",
        "sequence": 5,
        "date": "2025-11-25T00:00:00.000Z"
      },
      {
        "label": "Mentoria 6",
        "sequence": 6,
        "date": "2026-01-27T00:00:00.000Z"
      },
      {
        "label": "Mentoria 7",
        "sequence": 7,
        "date": "2026-03-20T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Ana",
    "company": "Avozon",
    "product": "Club",
    "csName": "Alessandra Dias",
    "entryDate": "2025-10-22T00:00:00.000Z",
    "renewalDate": "2026-10-22T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 107055.55,
    "lastContactAt": "2026-05-27T00:00:00.000Z",
    "nextContactAt": "2026-06-03T00:00:00.000Z",
    "notes": "E-mail: anavcolturato@gmail.com | Telefone: 14 991464833 | Segmento: Cosméticos Naturais | Valor renovação: R$ 53527.775",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2025-10-28T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2025-11-12T00:00:00.000Z"
      },
      {
        "label": "Mentoria 3",
        "sequence": 3,
        "date": "2026-03-16T00:00:00.000Z"
      },
      {
        "label": "Mentoria 4",
        "sequence": 4,
        "date": "2026-04-09T00:00:00.000Z"
      },
      {
        "label": "Mentoria 5",
        "sequence": 5,
        "date": "2026-04-10T00:00:00.000Z"
      },
      {
        "label": "Mentoria 6",
        "sequence": 6,
        "date": "2026-07-30T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Davi Luis / Felipe",
    "company": "Blessy",
    "product": "Club",
    "csName": "Alessandra Dias",
    "entryDate": "2026-01-09T00:00:00.000Z",
    "renewalDate": "2027-01-09T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 116800,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": "E-mail: davi@useblessy.com.br | Telefone: 24 993269059 | Segmento: Suplemento | Valor renovação: R$ 58400",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2026-01-09T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2026-02-03T00:00:00.000Z"
      },
      {
        "label": "Mentoria 3",
        "sequence": 3,
        "date": "2026-02-06T00:00:00.000Z"
      },
      {
        "label": "Mentoria 4",
        "sequence": 4,
        "date": "2025-09-23T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Carlos Shinzato",
    "company": "Brandness",
    "product": "Club",
    "csName": "Camila Leite",
    "entryDate": "2026-03-25T00:00:00.000Z",
    "renewalDate": "2027-03-25T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 154800,
    "lastContactAt": "2026-07-10T00:00:00.000Z",
    "nextContactAt": "2026-07-17T00:00:00.000Z",
    "notes": "E-mail: gabriel.martins@brandness.com.br | Telefone: 48 99101-8474 | Segmento: Guarda-chuva com 3 marcas nativas digitais | Valor renovação: R$ 77400",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2026-04-09T00:00:00.000Z"
      },
      {
        "label": "Mentoria 3",
        "sequence": 3,
        "date": "2026-04-23T00:00:00.000Z"
      },
      {
        "label": "Mentoria 4",
        "sequence": 4,
        "date": "2026-08-26T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Bruna",
    "company": "Bruna Castro Amorim",
    "product": "Club",
    "csName": "Alessandra Dias",
    "entryDate": "2026-01-05T00:00:00.000Z",
    "renewalDate": "2027-01-05T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 65000,
    "lastContactAt": "2026-06-08T00:00:00.000Z",
    "nextContactAt": "2026-06-15T00:00:00.000Z",
    "notes": "E-mail: bruna.castroamorim@hotmail.com | Telefone: 11 949636663 | Segmento: Moda Fitness | Valor renovação: R$ 32500",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2026-01-21T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2026-02-05T00:00:00.000Z"
      },
      {
        "label": "Mentoria 3",
        "sequence": 3,
        "date": "2026-05-25T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Conrado",
    "company": "Cotih",
    "product": "Club",
    "csName": "Alessandra Dias",
    "entryDate": "2025-04-28T00:00:00.000Z",
    "renewalDate": "2026-04-28T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 80000,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": "E-mail: conrado@wed.biz | Telefone: 17 991108272 | Segmento: Moda Feminina | vitalicio / RENOVAÇÃO SEM CUSTOS (NEGOCIADO COM DOM)",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2025-05-15T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2025-07-23T00:00:00.000Z"
      },
      {
        "label": "Mentoria 3",
        "sequence": 3,
        "date": "2025-09-23T00:00:00.000Z"
      },
      {
        "label": "Mentoria 4",
        "sequence": 4,
        "date": "2025-10-02T00:00:00.000Z"
      },
      {
        "label": "Mentoria 5",
        "sequence": 5,
        "date": "2026-01-22T00:00:00.000Z"
      },
      {
        "label": "Mentoria 6",
        "sequence": 6,
        "date": "2026-02-03T00:00:00.000Z"
      },
      {
        "label": "Mentoria 7",
        "sequence": 7,
        "date": "2026-03-18T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Caroline Rodrigues",
    "company": "Cr Store",
    "product": "Club",
    "csName": "Camila Leite",
    "entryDate": "2026-03-16T00:00:00.000Z",
    "renewalDate": "2027-03-16T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 154800,
    "lastContactAt": "2026-07-13T00:00:00.000Z",
    "nextContactAt": "2026-07-20T00:00:00.000Z",
    "notes": "E-mail: c_arolinerodrigues@hotmail.com | Telefone: 19 99917-3604 | Segmento: Moda Feminina | Valor renovação: R$ 77400",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2026-04-23T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2026-08-14T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Pyong E Natalia",
    "company": "De Nada",
    "product": "Club",
    "csName": "Alessandra Dias",
    "entryDate": "2026-09-09T18:48:15.921Z",
    "renewalDate": null,
    "status": "ativo",
    "contractValue": null,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": "E-mail: natalia@denada.com.br / pyongleetv@gmail.com | Telefone: 11 97601-0330 / 11 95282-2411 | Segmento: Alimento e bem-estar",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2026-06-18T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2026-07-10T00:00:00.000Z"
      },
      {
        "label": "Mentoria 3",
        "sequence": 3,
        "date": "2026-07-30T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Douglas",
    "company": "Dolcii",
    "product": "Club",
    "csName": "Alessandra Dias",
    "entryDate": "2026-04-16T00:00:00.000Z",
    "renewalDate": "2027-04-16T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 154800,
    "lastContactAt": "2026-06-08T00:00:00.000Z",
    "nextContactAt": "2026-06-15T00:00:00.000Z",
    "notes": "E-mail: d.pazolini@yahoo.com.br | Telefone: 47 999320010 | Segmento: Moda íntima feminina | Valor renovação: R$ 77400",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2026-05-15T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2026-05-29T00:00:00.000Z"
      },
      {
        "label": "Mentoria 3",
        "sequence": 3,
        "date": "2026-07-22T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "James",
    "company": "Doorman",
    "product": "Club",
    "csName": "Alessandra Dias",
    "entryDate": "2025-04-28T00:00:00.000Z",
    "renewalDate": "2026-04-28T00:00:00.000Z",
    "status": "cancelado",
    "contractValue": 72000,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": "Telefone: 11  933493829 | Valor renovação: R$ 36000 | DOM FICOU DE FAZER CONTATO COM O JAMES PARA RENOVAÇÃO. James falou para CS que não tem interesse em renovar e não quis reunião",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2025-06-03T00:00:00.000Z"
      },
      {
        "label": "Mentoria 3",
        "sequence": 3,
        "date": "2025-11-11T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Molise",
    "company": "Glowden Cosméticos",
    "product": "Club",
    "csName": "Alessandra Dias",
    "entryDate": "2026-02-01T00:00:00.000Z",
    "renewalDate": "2027-02-01T00:00:00.000Z",
    "status": "ativo",
    "contractValue": null,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": "E-mail: molisebernardo@outlook.com | Telefone: 17 98100-3378 | Segmento: Cosméticos | Valor renovação: R$ 30000 | Tração fez upseel para club",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2026-02-12T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2026-02-12T00:00:00.000Z"
      },
      {
        "label": "Mentoria 3",
        "sequence": 3,
        "date": "2026-07-16T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Roberto Arello",
    "company": "Golf Soul",
    "product": "Club",
    "csName": "Camila Leite",
    "entryDate": "2026-07-07T00:00:00.000Z",
    "renewalDate": "2027-07-07T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 130000,
    "lastContactAt": "2026-07-13T00:00:00.000Z",
    "nextContactAt": "2026-07-20T00:00:00.000Z",
    "notes": "E-mail: roberto@golfsoul.com.br | Telefone: 11 99630-0770 | Segmento: Vestuário Masculino | Valor renovação: R$ 65000",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2026-07-16T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2026-07-30T00:00:00.000Z"
      },
      {
        "label": "Mentoria 3",
        "sequence": 3,
        "date": "2026-07-22T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Diego / Douglas",
    "company": "Harmony Empório Natural",
    "product": "Club",
    "csName": "Alessandra Dias",
    "entryDate": "2026-03-16T00:00:00.000Z",
    "renewalDate": "2027-03-16T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 130000,
    "lastContactAt": "2026-06-10T00:00:00.000Z",
    "nextContactAt": "2026-06-17T00:00:00.000Z",
    "notes": "E-mail: contato.diegoalmeida@icloud | Telefone: 11 999436476 | Segmento: Moda Masculina | Valor renovação: R$ 65000",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2026-06-18T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2026-07-31T00:00:00.000Z"
      },
      {
        "label": "Mentoria 3",
        "sequence": 3,
        "date": "2026-06-03T00:00:00.000Z"
      },
      {
        "label": "Mentoria 4",
        "sequence": 4,
        "date": "2026-07-31T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Luis Filipe",
    "company": "Hiven Cosméticos",
    "product": "Club",
    "csName": "Alessandra Dias",
    "entryDate": "2026-03-19T00:00:00.000Z",
    "renewalDate": "2027-03-19T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 154800,
    "lastContactAt": "2026-06-10T00:00:00.000Z",
    "nextContactAt": "2026-06-17T00:00:00.000Z",
    "notes": "E-mail: hivencosmeticos@gmail.com | Telefone: 12 991846402 | Segmento: Cosméticos | Valor renovação: R$ 77400",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2026-05-07T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2026-05-28T00:00:00.000Z"
      },
      {
        "label": "Mentoria 3",
        "sequence": 3,
        "date": "2026-05-20T00:00:00.000Z"
      },
      {
        "label": "Mentoria 4",
        "sequence": 4,
        "date": "2026-06-25T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Ana Carolina",
    "company": "Ilumina Beautē",
    "product": "Club",
    "csName": "Camila Leite",
    "entryDate": "2026-07-13T00:00:00.000Z",
    "renewalDate": "2027-07-13T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 159000,
    "lastContactAt": "2026-07-10T00:00:00.000Z",
    "nextContactAt": "2026-07-17T00:00:00.000Z",
    "notes": "E-mail: ana_verardi@hotmail.com | Telefone: 54 99601-6583 | Segmento: Cosméticos | Valor renovação: R$ 79500",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2026-07-30T00:00:00.000Z"
      },
      {
        "label": "Mentoria 3",
        "sequence": 3,
        "date": "2026-07-30T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Pedro",
    "company": "Ju Leme",
    "product": "Club",
    "csName": "Alessandra Dias",
    "entryDate": "2026-04-01T00:00:00.000Z",
    "renewalDate": "2027-04-01T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 154800,
    "lastContactAt": "2026-06-12T00:00:00.000Z",
    "nextContactAt": "2026-06-19T00:00:00.000Z",
    "notes": "E-mail: pedraum789@gmail.com | Telefone: 11 963271260 | Segmento: Cosméticos (Maquiagem) | Valor renovação: R$ 77400",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2026-04-16T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2026-05-07T00:00:00.000Z"
      },
      {
        "label": "Mentoria 3",
        "sequence": 3,
        "date": "2026-05-20T00:00:00.000Z"
      },
      {
        "label": "Mentoria 4",
        "sequence": 4,
        "date": "2026-07-10T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Fabiana",
    "company": "Lagai",
    "product": "Club",
    "csName": "Alessandra Dias",
    "entryDate": "2025-12-20T00:00:00.000Z",
    "renewalDate": "2026-12-20T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 120000,
    "lastContactAt": "2026-06-10T00:00:00.000Z",
    "nextContactAt": "2026-06-20T00:00:00.000Z",
    "notes": "E-mail: fabianaxavier80@hotmail.com | Telefone: 64 996271828 | Segmento: Cosméticos e Maquiagem | Valor renovação: R$ 60000",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2026-01-15T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2026-01-19T00:00:00.000Z"
      },
      {
        "label": "Mentoria 3",
        "sequence": 3,
        "date": "2026-01-20T00:00:00.000Z"
      },
      {
        "label": "Mentoria 4",
        "sequence": 4,
        "date": "2026-01-22T00:00:00.000Z"
      },
      {
        "label": "Mentoria 5",
        "sequence": 5,
        "date": "2026-02-19T00:00:00.000Z"
      },
      {
        "label": "Mentoria 6",
        "sequence": 6,
        "date": "2026-02-25T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Paula Tondato",
    "company": "Lakma",
    "product": "Club",
    "csName": "Alessandra Dias",
    "entryDate": "2025-08-09T00:00:00.000Z",
    "renewalDate": "2026-08-09T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 116400,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": "E-mail: paula@lakma.com.br | Telefone: 14 996804052 | Segmento: Cosméticos | Valor renovação: R$ 58200 | CS FAZER CONTATO PARA REUNIÃO DE ACOMPANHAMENTO",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2025-08-26T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2025-09-29T00:00:00.000Z"
      },
      {
        "label": "Mentoria 3",
        "sequence": 3,
        "date": "2025-10-13T00:00:00.000Z"
      },
      {
        "label": "Mentoria 4",
        "sequence": 4,
        "date": "2025-11-26T00:00:00.000Z"
      },
      {
        "label": "Mentoria 5",
        "sequence": 5,
        "date": "2025-12-08T00:00:00.000Z"
      },
      {
        "label": "Mentoria 6",
        "sequence": 6,
        "date": "2026-01-22T00:00:00.000Z"
      },
      {
        "label": "Mentoria 7",
        "sequence": 7,
        "date": "2026-01-23T00:00:00.000Z"
      },
      {
        "label": "Mentoria 8",
        "sequence": 8,
        "date": "2026-02-04T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Luiza Sell Souto Goulart",
    "company": "Livvan",
    "product": "Club",
    "csName": "Camila Leite",
    "entryDate": "2026-04-01T00:00:00.000Z",
    "renewalDate": "2027-04-01T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 154800,
    "lastContactAt": "2026-07-13T00:00:00.000Z",
    "nextContactAt": "2026-07-20T00:00:00.000Z",
    "notes": "E-mail: adm@livvan.com.br | Telefone: 47 99691-1117 | Segmento: Suplementos | Valor renovação: R$ 77400",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2026-04-09T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2026-04-23T00:00:00.000Z"
      },
      {
        "label": "Mentoria 3",
        "sequence": 3,
        "date": "2026-05-13T00:00:00.000Z"
      },
      {
        "label": "Mentoria 4",
        "sequence": 4,
        "date": "2026-07-23T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Tamiris",
    "company": "Luli Baby",
    "product": "Club",
    "csName": "Alessandra Dias",
    "entryDate": "2026-09-09T18:48:15.924Z",
    "renewalDate": null,
    "status": "ativo",
    "contractValue": null,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": "E-mail: tamiriscristina30@gmail.com | Segmento: Cosméticos e Calçados Infanti",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2025-10-24T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2025-11-17T00:00:00.000Z"
      },
      {
        "label": "Mentoria 3",
        "sequence": 3,
        "date": "2026-01-20T00:00:00.000Z"
      },
      {
        "label": "Mentoria 4",
        "sequence": 4,
        "date": "2026-02-05T00:00:00.000Z"
      },
      {
        "label": "Mentoria 5",
        "sequence": 5,
        "date": "2026-02-12T00:00:00.000Z"
      },
      {
        "label": "Mentoria 6",
        "sequence": 6,
        "date": "2026-02-21T00:00:00.000Z"
      },
      {
        "label": "Mentoria 7",
        "sequence": 7,
        "date": "2026-05-06T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Bruna",
    "company": "Marka Têxtil",
    "product": "Club",
    "csName": "Alessandra Dias",
    "entryDate": "2026-02-25T00:00:00.000Z",
    "renewalDate": "2027-02-25T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 120000,
    "lastContactAt": "2026-06-08T00:00:00.000Z",
    "nextContactAt": "2026-06-15T00:00:00.000Z",
    "notes": "E-mail: brunaantonelli@markatextil.com.br | Telefone: 11 975444564 | Segmento: Blackouts | Valor renovação: R$ 60000",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2026-03-19T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2026-04-29T00:00:00.000Z"
      },
      {
        "label": "Mentoria 3",
        "sequence": 3,
        "date": "2026-05-21T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Luiz Henrique Nakoneczny",
    "company": "Menocare",
    "product": "Club",
    "csName": "Camila Leite",
    "entryDate": "2026-06-10T00:00:00.000Z",
    "renewalDate": "2027-06-10T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 120000,
    "lastContactAt": "2026-07-10T00:00:00.000Z",
    "nextContactAt": "2026-07-17T00:00:00.000Z",
    "notes": "E-mail: luizhenriquen98@gmail.com | Telefone: 45 99827-3295 | Segmento: Suplementos | Valor renovação: R$ 60000",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2026-07-27T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2026-09-03T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Gabriel Pedro",
    "company": "Mr Carvalho",
    "product": "Club",
    "csName": "Camila Leite",
    "entryDate": "2026-06-13T00:00:00.000Z",
    "renewalDate": "2027-06-13T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 135000,
    "lastContactAt": "2026-07-10T00:00:00.000Z",
    "nextContactAt": "2026-07-17T00:00:00.000Z",
    "notes": "E-mail: gabrielpeddro@gmail.com | Telefone: 19 98312-0725 | Segmento: Aromatizador | Valor renovação: R$ 67500",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2026-06-19T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2026-07-10T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Bia Napolitano",
    "company": "Nappô",
    "product": "Club",
    "csName": "Camila Leite",
    "entryDate": "2026-02-15T00:00:00.000Z",
    "renewalDate": "2027-02-15T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 150000,
    "lastContactAt": "2026-07-10T00:00:00.000Z",
    "nextContactAt": "2026-07-17T00:00:00.000Z",
    "notes": "E-mail: bia@bianapolitano.com.br | Telefone: 11 98918-9438 | Segmento: Moda Pijama | Valor renovação: R$ 75000",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2026-01-29T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2026-03-05T00:00:00.000Z"
      },
      {
        "label": "Mentoria 3",
        "sequence": 3,
        "date": "2026-02-12T00:00:00.000Z"
      },
      {
        "label": "Mentoria 4",
        "sequence": 4,
        "date": "2026-02-23T00:00:00.000Z"
      },
      {
        "label": "Mentoria 5",
        "sequence": 5,
        "date": "2026-03-10T00:00:00.000Z"
      },
      {
        "label": "Mentoria 6",
        "sequence": 6,
        "date": "2026-03-26T00:00:00.000Z"
      },
      {
        "label": "Mentoria 7",
        "sequence": 7,
        "date": "2026-04-08T00:00:00.000Z"
      },
      {
        "label": "Mentoria 8",
        "sequence": 8,
        "date": "2026-05-14T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Gustavo",
    "company": "Ocean Drop",
    "product": "Club",
    "csName": "Camila Leite",
    "entryDate": "2026-03-12T00:00:00.000Z",
    "renewalDate": "2027-03-12T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 120000,
    "lastContactAt": "2026-07-10T00:00:00.000Z",
    "nextContactAt": "2026-07-17T00:00:00.000Z",
    "notes": "E-mail: gustavo@oceandrop.com.br | Telefone: 11 98225-8805 | Segmento: Suplementos | Valor renovação: R$ 60000",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2026-03-18T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2026-04-16T00:00:00.000Z"
      },
      {
        "label": "Mentoria 3",
        "sequence": 3,
        "date": "2026-03-31T00:00:00.000Z"
      },
      {
        "label": "Mentoria 4",
        "sequence": 4,
        "date": "2026-04-27T00:00:00.000Z"
      },
      {
        "label": "Mentoria 5",
        "sequence": 5,
        "date": "2026-05-28T00:00:00.000Z"
      },
      {
        "label": "Mentoria 6",
        "sequence": 6,
        "date": "2026-06-26T00:00:00.000Z"
      },
      {
        "label": "Mentoria 7",
        "sequence": 7,
        "date": "2026-07-09T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Junior Parente",
    "company": "Óleos Medity",
    "product": "Club",
    "csName": "Camila Leite",
    "entryDate": "2026-07-02T00:00:00.000Z",
    "renewalDate": "2027-07-02T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 154800,
    "lastContactAt": "2026-07-13T00:00:00.000Z",
    "nextContactAt": "2026-07-20T00:00:00.000Z",
    "notes": "E-mail: juniormistral22@gmail.com | Telefone: 85 97400-6331 | Segmento: Óleos Essenciais | Valor renovação: R$ 77400",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2026-07-16T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2026-07-30T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Octavio Galhardi",
    "company": "Organica",
    "product": "Club",
    "csName": "Camila Leite",
    "entryDate": "2025-12-01T00:00:00.000Z",
    "renewalDate": "2026-12-01T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 116400,
    "lastContactAt": "2026-07-10T00:00:00.000Z",
    "nextContactAt": "2026-07-17T00:00:00.000Z",
    "notes": "E-mail: felipe.lima@grupoorganica.com.br | Telefone: 11 99327-0935 | Segmento: Cosméticos | Valor renovação: R$ 58200 | Fez mais duas mentorias em 31/07/2026 além das que já tinha direito",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2025-12-11T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2026-01-21T00:00:00.000Z"
      },
      {
        "label": "Mentoria 3",
        "sequence": 3,
        "date": "2026-02-12T00:00:00.000Z"
      },
      {
        "label": "Mentoria 4",
        "sequence": 4,
        "date": "2026-02-18T00:00:00.000Z"
      },
      {
        "label": "Mentoria 5",
        "sequence": 5,
        "date": "2026-04-17T00:00:00.000Z"
      },
      {
        "label": "Mentoria 6",
        "sequence": 6,
        "date": "2026-04-26T00:00:00.000Z"
      },
      {
        "label": "Mentoria 7",
        "sequence": 7,
        "date": "2026-05-22T00:00:00.000Z"
      },
      {
        "label": "Mentoria 8",
        "sequence": 8,
        "date": "2026-06-25T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Juliana",
    "company": "Samba Skincare",
    "product": "Club",
    "csName": "Alessandra Dias",
    "entryDate": "2026-03-16T00:00:00.000Z",
    "renewalDate": "2027-03-16T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 154800,
    "lastContactAt": "2026-05-25T00:00:00.000Z",
    "nextContactAt": "2026-06-01T00:00:00.000Z",
    "notes": "E-mail: juliana.aleluia@sambaskincare.com.br | Telefone: 71 999255560 | Segmento: Cosméticos | Valor renovação: R$ 77400",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2026-04-01T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2026-04-15T00:00:00.000Z"
      },
      {
        "label": "Mentoria 3",
        "sequence": 3,
        "date": "2026-04-24T00:00:00.000Z"
      },
      {
        "label": "Mentoria 4",
        "sequence": 4,
        "date": "2026-07-10T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Marcus Dutra",
    "company": "Strongest",
    "product": "Club",
    "csName": "Camila Leite",
    "entryDate": "2025-04-28T00:00:00.000Z",
    "renewalDate": "2026-04-28T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 34000,
    "lastContactAt": "2026-07-10T00:00:00.000Z",
    "nextContactAt": "2026-07-17T00:00:00.000Z",
    "notes": "E-mail: marcusviniciusdutra1@gmail.com | Telefone: 14 98118-8850 | Segmento: Suplementos | Valor renovação: R$ 17000 | Renovou\nVAI FICAR POR 6 MESES DE FORMA GRATUITA POR DIFICULDADES FINANCEIRA. APÓS 6 MESES SE TIVER TIDO RESULTADOS A GENTE FAZ PROPOSTA DE NEGOCIAÇÃO",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2026-09-03T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Sergio",
    "company": "Uvits Vitaminas",
    "product": "Club",
    "csName": "Alessandra Dias",
    "entryDate": "2026-03-25T00:00:00.000Z",
    "renewalDate": "2027-03-25T00:00:00.000Z",
    "status": "pausado",
    "contractValue": 120000,
    "lastContactAt": "2026-06-05T00:00:00.000Z",
    "nextContactAt": "2026-06-12T00:00:00.000Z",
    "notes": "E-mail: contato@uvits.com.br | Telefone: 19 953215068 | Segmento: Suplementos | Valor renovação: R$ 60000 | Pausou pgtos e mentoria por 3 meses | Pausou pgtos e mentoria por 3 meses",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2026-04-09T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2026-04-29T00:00:00.000Z"
      },
      {
        "label": "Mentoria 3",
        "sequence": 3,
        "date": "2026-06-03T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Pedro",
    "company": "Wahana",
    "product": "Club",
    "csName": "Alessandra Dias",
    "entryDate": "2026-02-13T00:00:00.000Z",
    "renewalDate": "2027-02-13T00:00:00.000Z",
    "status": "ativo",
    "contractValue": null,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": "E-mail: pedro@wahana.com.br | Telefone: 51 9985-4012 | Segmento: Cosméticos",
    "meetings": []
  },
  {
    "name": "Gabriel Lombardi",
    "company": "Zencial",
    "product": "Club",
    "csName": "Camila Leite",
    "entryDate": "2025-04-28T00:00:00.000Z",
    "renewalDate": "2026-04-28T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 79000,
    "lastContactAt": "2026-07-10T00:00:00.000Z",
    "nextContactAt": "2026-07-17T00:00:00.000Z",
    "notes": "E-mail: lombardigt@gmail.com | Telefone: 48 99900-5493 | Segmento: Cosméticos | Valor renovação: R$ 39500 | O Dom está conversando com ele PARA NEGOCIAR POR 20K, pois ele estava sem querer renovar por não ter aproveitado a mentoria.",
    "meetings": []
  },
  {
    "name": "Fabio",
    "company": "Ziva",
    "product": "Club",
    "csName": "Alessandra Dias",
    "entryDate": "2026-03-16T00:00:00.000Z",
    "renewalDate": "2027-03-16T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 120000,
    "lastContactAt": "2026-06-10T00:00:00.000Z",
    "nextContactAt": "2026-06-17T00:00:00.000Z",
    "notes": "E-mail: diretoria@sejaziva.com.br | Telefone: 87 981521000 | Segmento: Cosméticos | Valor renovação: R$ 60000",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2026-04-08T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2026-04-28T00:00:00.000Z"
      },
      {
        "label": "Mentoria 3",
        "sequence": 3,
        "date": "2026-05-07T00:00:00.000Z"
      },
      {
        "label": "Mentoria 4",
        "sequence": 4,
        "date": "2026-05-21T00:00:00.000Z"
      },
      {
        "label": "Mentoria 5",
        "sequence": 5,
        "date": "2026-08-27T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Igor Torres",
    "company": "Natuhair",
    "product": "Club",
    "csName": "Alessandra Dias",
    "entryDate": "2026-07-14T00:00:00.000Z",
    "renewalDate": "2027-07-14T00:00:00.000Z",
    "status": "ativo",
    "contractValue": null,
    "lastContactAt": "2026-07-14T00:00:00.000Z",
    "nextContactAt": "2026-07-21T00:00:00.000Z",
    "notes": "E-mail: igorstorres@gmail.com | Telefone: 21 99011-8063 | Segmento: Cosméticos",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2026-07-23T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2026-08-27T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Anamélia",
    "company": "Prohair",
    "product": "Club",
    "csName": "Alessandra Dias",
    "entryDate": "2026-07-15T00:00:00.000Z",
    "renewalDate": "2027-07-15T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 139600,
    "lastContactAt": "2026-07-15T00:00:00.000Z",
    "nextContactAt": "2026-07-22T00:00:00.000Z",
    "notes": "E-mail: prohair.vp@gmail.com | Telefone: 11 99554-6715 | Segmento: Cosméticos | Valor renovação: R$ 69800",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2026-07-24T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2026-08-13T00:00:00.000Z"
      },
      {
        "label": "Mentoria 3",
        "sequence": 3,
        "date": "2026-08-28T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Marcelo",
    "company": "Pienna",
    "product": "Club",
    "csName": "Alessandra Dias",
    "entryDate": "2026-07-16T00:00:00.000Z",
    "renewalDate": "2027-07-16T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 159000,
    "lastContactAt": "2026-07-17T00:00:00.000Z",
    "nextContactAt": "2026-07-24T00:00:00.000Z",
    "notes": "E-mail: marcelo.krein@live.com | Telefone: 51 8169-1959 | Segmento: Semi Joias | Valor renovação: R$ 79500",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2026-07-24T00:00:00.000Z"
      },
      {
        "label": "Mentoria 3",
        "sequence": 3,
        "date": "2026-08-06T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Rafael Riciole",
    "company": "Roi Suplementos",
    "product": "Club",
    "csName": "Camila Leite",
    "entryDate": "2026-07-16T00:00:00.000Z",
    "renewalDate": null,
    "status": "ativo",
    "contractValue": null,
    "lastContactAt": "2026-09-08T00:00:00.000Z",
    "nextContactAt": "2026-09-15T00:00:00.000Z",
    "notes": "E-mail: contato@roioficial.com | Telefone: 64 9266-5726 | Segmento: Suplemetos | A principio, serão 3 reuniões somente. Após será necociado upsell",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2026-08-05T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2026-08-13T00:00:00.000Z"
      },
      {
        "label": "Mentoria 3",
        "sequence": 3,
        "date": "2026-08-27T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Luiz Paulo Gonçalves",
    "company": "Easyboost",
    "product": "Club",
    "csName": "Camila Leite",
    "entryDate": "2025-09-26T00:00:00.000Z",
    "renewalDate": "2026-09-26T00:00:00.000Z",
    "status": "ativo",
    "contractValue": null,
    "lastContactAt": "2026-09-01T00:00:00.000Z",
    "nextContactAt": "2026-09-08T00:00:00.000Z",
    "notes": "E-mail: luiz@easyboost.com.br | Telefone: 11 99579-1866",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2025-10-07T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2026-10-29T00:00:00.000Z"
      },
      {
        "label": "Mentoria 3",
        "sequence": 3,
        "date": "2025-12-15T00:00:00.000Z"
      },
      {
        "label": "Mentoria 4",
        "sequence": 4,
        "date": "2026-04-15T00:00:00.000Z"
      },
      {
        "label": "Mentoria 5",
        "sequence": 5,
        "date": "2026-06-05T00:00:00.000Z"
      },
      {
        "label": "Mentoria 6",
        "sequence": 6,
        "date": "2026-06-19T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Ygor",
    "company": "Memora Digital",
    "product": "Club",
    "csName": "Camila Leite",
    "entryDate": "2025-08-25T00:00:00.000Z",
    "renewalDate": "2026-08-25T00:00:00.000Z",
    "status": "ativo",
    "contractValue": null,
    "lastContactAt": "2026-09-08T00:00:00.000Z",
    "nextContactAt": "2026-09-15T00:00:00.000Z",
    "notes": "E-mail: ygorbatista.ads@gmail.com | Telefone: 16 99322-8996",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2025-08-22T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2025-09-09T00:00:00.000Z"
      },
      {
        "label": "Mentoria 3",
        "sequence": 3,
        "date": "2025-09-18T00:00:00.000Z"
      },
      {
        "label": "Mentoria 4",
        "sequence": 4,
        "date": "2025-09-22T00:00:00.000Z"
      },
      {
        "label": "Mentoria 5",
        "sequence": 5,
        "date": "2025-09-29T00:00:00.000Z"
      },
      {
        "label": "Mentoria 6",
        "sequence": 6,
        "date": "2025-09-30T00:00:00.000Z"
      },
      {
        "label": "Mentoria 7",
        "sequence": 7,
        "date": "2025-12-10T00:00:00.000Z"
      },
      {
        "label": "Mentoria 8",
        "sequence": 8,
        "date": "2026-06-11T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Vitallini Suplementos (Toledo & Janini)",
    "company": null,
    "product": "Club",
    "csName": "Camila Leite",
    "entryDate": "2026-09-02T00:00:00.000Z",
    "renewalDate": "2027-09-02T00:00:00.000Z",
    "status": "ativo",
    "contractValue": null,
    "lastContactAt": "2026-09-08T00:00:00.000Z",
    "nextContactAt": "2026-09-15T00:00:00.000Z",
    "notes": null,
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2026-09-08T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Spf Distribuidora",
    "company": null,
    "product": "Club",
    "csName": "Camila Leite",
    "entryDate": "2026-09-02T00:00:00.000Z",
    "renewalDate": "2027-09-02T00:00:00.000Z",
    "status": "ativo",
    "contractValue": null,
    "lastContactAt": "2026-09-03T00:00:00.000Z",
    "nextContactAt": "2026-09-10T00:00:00.000Z",
    "notes": null,
    "meetings": []
  },
  {
    "name": "Majoris Comércio De Produtos Naturais Ltda",
    "company": null,
    "product": "Club",
    "csName": null,
    "entryDate": "2026-09-09T18:48:15.936Z",
    "renewalDate": null,
    "status": "ativo",
    "contractValue": null,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": null,
    "meetings": []
  },
  {
    "name": "Roma Distribuidora De Produtos De Beleza Ltda",
    "company": null,
    "product": "Club",
    "csName": null,
    "entryDate": "2026-09-09T18:48:15.936Z",
    "renewalDate": null,
    "status": "ativo",
    "contractValue": null,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": null,
    "meetings": []
  },
  {
    "name": "Souly Comércio De Superalimentos Ltda",
    "company": null,
    "product": "Club",
    "csName": null,
    "entryDate": "2026-09-09T18:48:15.936Z",
    "renewalDate": null,
    "status": "ativo",
    "contractValue": null,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": null,
    "meetings": []
  },
  {
    "name": "Angela Farias",
    "company": "Bambbu Cosmeticos",
    "product": "Club",
    "csName": null,
    "entryDate": "2026-09-09T18:48:15.936Z",
    "renewalDate": null,
    "status": "ativo",
    "contractValue": null,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": "E-mail: bambbucosmeticos@outlook.com | Telefone: 11951952688",
    "meetings": []
  },
  {
    "name": "Darlan Heleno",
    "company": "Fumpi Kids",
    "product": "Club",
    "csName": null,
    "entryDate": "2026-09-09T18:48:15.936Z",
    "renewalDate": null,
    "status": "ativo",
    "contractValue": null,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": "E-mail: darlanheleno1991@gmail.com | Telefone: 81 97105-4141",
    "meetings": []
  },
  {
    "name": "Moacir",
    "company": "Nutriage Suplementos",
    "product": "Tração",
    "csName": "Alessandra Dias",
    "entryDate": "2025-09-09T00:00:00.000Z",
    "renewalDate": "2026-03-08T00:00:00.000Z",
    "status": "em_risco",
    "contractValue": 46600,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": "E-mail: nutriagesuplementos@gmail.com | Telefone: 33 99153‑8881‬ | Segmento: Suplementos | Status atual: ⭕️ NÃO RESPONDE",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2025-10-10T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2026-01-14T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Paulo Sergio",
    "company": "ACALANTA COSMETICOS LTDA",
    "product": "Tração",
    "csName": "Alessandra Dias",
    "entryDate": "2025-10-31T00:00:00.000Z",
    "renewalDate": "2026-04-29T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 38000,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": "E-mail: paulo.sergio@lozinskyconsultoria.com.br | Segmento: Cosméticos",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2025-11-17T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2025-11-27T00:00:00.000Z"
      },
      {
        "label": "Mentoria 1",
        "sequence": 3,
        "date": "2026-01-23T00:00:00.000Z"
      },
      {
        "label": "Mentoria 2",
        "sequence": 4,
        "date": "2026-02-06T00:00:00.000Z"
      },
      {
        "label": "Mentoria 3",
        "sequence": 5,
        "date": "2026-02-19T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Beth Caetano",
    "company": "EVA NUTRASCIENCE LTDA",
    "product": "Tração",
    "csName": "Camila Leite",
    "entryDate": "2025-11-01T00:00:00.000Z",
    "renewalDate": "2026-04-30T00:00:00.000Z",
    "status": "em_risco",
    "contractValue": 39900,
    "lastContactAt": "2026-06-22T00:00:00.000Z",
    "nextContactAt": null,
    "notes": "E-mail: bethcaetanoimoveis@gmail.com | Telefone: 54 98414-7720 | Segmento: Suplementos | está em fase de renovação. Passei pro Dom, pois ela não me responde. | Status atual: ⭕️ NÃO RESPONDE",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2025-10-27T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2025-11-13T00:00:00.000Z"
      },
      {
        "label": "Mentoria 1",
        "sequence": 3,
        "date": "2025-11-19T00:00:00.000Z"
      },
      {
        "label": "Mentoria 2",
        "sequence": 4,
        "date": "2026-02-11T00:00:00.000Z"
      },
      {
        "label": "Mentoria 3",
        "sequence": 5,
        "date": "2026-04-16T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Franciele",
    "company": "REJUV CLINICAL COMERCIO DE COSMETICOS LTDA",
    "product": "Tração",
    "csName": "Alessandra Dias",
    "entryDate": "2025-11-11T00:00:00.000Z",
    "renewalDate": "2026-05-10T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 41000,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": "E-mail: franciele@rejuv.com.br | Segmento: Cosméticos",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2025-11-11T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2025-11-26T00:00:00.000Z"
      },
      {
        "label": "Mentoria 1",
        "sequence": 3,
        "date": "2026-01-15T00:00:00.000Z"
      },
      {
        "label": "Mentoria 2",
        "sequence": 4,
        "date": "2026-03-06T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "NUTREE COMERCIO",
    "company": null,
    "product": "Tração",
    "csName": "Camila Leite",
    "entryDate": "2025-12-03T00:00:00.000Z",
    "renewalDate": "2026-06-01T00:00:00.000Z",
    "status": "ativo",
    "contractValue": null,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": "Segmento: Produtos naturais",
    "meetings": []
  },
  {
    "name": "BEEPFIT",
    "company": null,
    "product": "Tração",
    "csName": "Camila Leite",
    "entryDate": "2026-04-02T00:00:00.000Z",
    "renewalDate": "2026-09-29T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 50000,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": "Segmento: Moda fitness",
    "meetings": []
  },
  {
    "name": "Maristela",
    "company": "Houtree",
    "product": "Tração",
    "csName": "Camila Leite",
    "entryDate": "2026-09-09T18:48:15.942Z",
    "renewalDate": null,
    "status": "ativo",
    "contractValue": 52000,
    "lastContactAt": "2026-06-23T00:00:00.000Z",
    "nextContactAt": null,
    "notes": "E-mail: maristela@houtree.com.br | Telefone: 1 (908) 536-4115 | Segmento: Cosméticos | Status atual: ⚠️ POUCO PARTICIPATIVO",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2026-01-21T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2026-02-06T00:00:00.000Z"
      },
      {
        "label": "Mentoria 1",
        "sequence": 3,
        "date": "2026-02-23T00:00:00.000Z"
      },
      {
        "label": "Mentoria 2",
        "sequence": 4,
        "date": "2026-06-26T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Nathan",
    "company": "DIVN",
    "product": "Tração",
    "csName": "Camila Leite",
    "entryDate": "2026-06-01T00:00:00.000Z",
    "renewalDate": "2027-06-01T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 60000,
    "lastContactAt": "2026-07-09T00:00:00.000Z",
    "nextContactAt": null,
    "notes": "E-mail: divn@divn.com.br | Telefone: 27 98173‑3601‬ | Segmento: Moda masculina | Status atual: ✅ PARTICIPATIVO",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2026-06-11T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2026-06-26T00:00:00.000Z"
      },
      {
        "label": "Mentoria 1",
        "sequence": 3,
        "date": "2026-08-05T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Roger",
    "company": "Policlean",
    "product": "Tração",
    "csName": "Alessandra Dias",
    "entryDate": "2026-05-19T00:00:00.000Z",
    "renewalDate": "2027-05-19T00:00:00.000Z",
    "status": "ativo",
    "contractValue": null,
    "lastContactAt": "2026-07-10T00:00:00.000Z",
    "nextContactAt": null,
    "notes": "E-mail: roger@policlean.com.br | Telefone: 19 99644-7725 | Segmento: Produtos de limpeza | Status atual: ✅ PARTICIPATIVO",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2026-05-26T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2026-06-17T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Karine Auricchio",
    "company": "ALLOEZIL",
    "product": "Tração",
    "csName": "Camila Leite",
    "entryDate": "2026-06-23T00:00:00.000Z",
    "renewalDate": "2027-06-23T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 50000,
    "lastContactAt": "2026-07-14T00:00:00.000Z",
    "nextContactAt": null,
    "notes": "E-mail: karine.auricchio@gmail.com | Telefone: 11 98558-4042 | Segmento: Suplementos | Status atual: ✅ PARTICIPATIVO",
    "meetings": [
      {
        "label": "Diagnóstico",
        "sequence": 1,
        "date": "2027-07-10T00:00:00.000Z"
      },
      {
        "label": "Plano de Ação",
        "sequence": 2,
        "date": "2026-07-30T00:00:00.000Z"
      }
    ]
  },
  {
    "name": "Green Line",
    "company": null,
    "product": "Club",
    "csName": null,
    "entryDate": "2025-04-28T00:00:00.000Z",
    "renewalDate": "2026-04-28T00:00:00.000Z",
    "status": "cancelado",
    "contractValue": 94800,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": null,
    "meetings": []
  },
  {
    "name": "Maval",
    "company": null,
    "product": "Club",
    "csName": null,
    "entryDate": "2025-04-28T00:00:00.000Z",
    "renewalDate": "2026-04-28T00:00:00.000Z",
    "status": "cancelado",
    "contractValue": 94800,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": null,
    "meetings": []
  },
  {
    "name": "New Life",
    "company": null,
    "product": "Club",
    "csName": null,
    "entryDate": "2025-04-28T00:00:00.000Z",
    "renewalDate": "2026-04-28T00:00:00.000Z",
    "status": "cancelado",
    "contractValue": 94800,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": null,
    "meetings": []
  },
  {
    "name": "Onocaps",
    "company": null,
    "product": "Club",
    "csName": "Giordana Konrath",
    "entryDate": "2025-04-28T00:00:00.000Z",
    "renewalDate": "2026-04-28T00:00:00.000Z",
    "status": "pausado",
    "contractValue": 90500,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": "DOM PEDIU PARA REATIVAR (ENVIAR MENSAGEM CHAMANDO PRA REUNIÃO DA CS E KARINA) | Status atual: EM FASE DE RENOVAÇÃO",
    "meetings": []
  },
  {
    "name": "Giba",
    "company": "Plankton Cosmeticos",
    "product": "Club",
    "csName": null,
    "entryDate": "2025-04-28T00:00:00.000Z",
    "renewalDate": "2026-04-28T00:00:00.000Z",
    "status": "pausado",
    "contractValue": 80000,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": "GIBA ESTÁ COM DIFICULDADES NA EMPRESA. É PRA CS ENTRAR EM CONTATO E SONDAR COMO ESTÁ A SITUAÇÃO DA EMPRESA E SE FAZ SENTIDO REATIVAR. PARA FLEXIBILIZAR VALORES | Status atual: EM FASE DE RENOVAÇÃO",
    "meetings": []
  },
  {
    "name": "Leaf",
    "company": null,
    "product": "Club",
    "csName": "Camila Leite",
    "entryDate": "2025-05-10T00:00:00.000Z",
    "renewalDate": "2026-05-10T00:00:00.000Z",
    "status": "cancelado",
    "contractValue": 94400,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": null,
    "meetings": []
  },
  {
    "name": "Luminna Gest",
    "company": null,
    "product": "Club",
    "csName": null,
    "entryDate": "2025-05-10T00:00:00.000Z",
    "renewalDate": "2026-05-10T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 94800,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": "ACIONAR O RAFAEL (ACIONAR O DOM PRA PEDIR O CONTATO) | Status atual: EM FASE DE RENOVAÇÃO",
    "meetings": []
  },
  {
    "name": "AWD ECOMMERCE - WALDEMIRO PEREIRA NETO",
    "company": null,
    "product": "Club",
    "csName": null,
    "entryDate": "2025-05-15T00:00:00.000Z",
    "renewalDate": "2026-05-15T00:00:00.000Z",
    "status": "pausado",
    "contractValue": 80000,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": "DESCONSIDERAR. NÃO RENVOAR",
    "meetings": []
  },
  {
    "name": "Thelf",
    "company": null,
    "product": "Club",
    "csName": null,
    "entryDate": "2025-06-10T00:00:00.000Z",
    "renewalDate": "2026-06-10T00:00:00.000Z",
    "status": "ativo",
    "contractValue": null,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": "O DOM NÃO SABE",
    "meetings": []
  },
  {
    "name": "LU FERNANDES",
    "company": null,
    "product": "Club",
    "csName": null,
    "entryDate": "2025-06-26T00:00:00.000Z",
    "renewalDate": "2026-06-26T00:00:00.000Z",
    "status": "ativo",
    "contractValue": null,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": "FALAR COM A CAROL, POIS ERA UMA TROCA/PERMUTA",
    "meetings": []
  },
  {
    "name": "Agrega",
    "company": null,
    "product": "Club",
    "csName": null,
    "entryDate": "2025-08-09T00:00:00.000Z",
    "renewalDate": "2026-08-09T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 116400,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": "DOM NÃO SABE. VERIFICAR COM A CAROL",
    "meetings": []
  },
  {
    "name": "GABRIELLA CHIL DE VASCONCELOS",
    "company": null,
    "product": "Club",
    "csName": null,
    "entryDate": "2025-08-09T00:00:00.000Z",
    "renewalDate": "2026-08-09T00:00:00.000Z",
    "status": "ativo",
    "contractValue": null,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": "DOM NÃO SABE. VERIFICAR COM A CAROL",
    "meetings": []
  },
  {
    "name": "MARCIO GABRIEL FERNANDES DA MOTTA",
    "company": null,
    "product": "Club",
    "csName": null,
    "entryDate": "2025-08-09T00:00:00.000Z",
    "renewalDate": "2026-08-09T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 121400,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": "DOM NÃO SABE. VERIFICAR COM A CAROL",
    "meetings": []
  },
  {
    "name": "Paula Tondato",
    "company": "Lakma",
    "product": "Club",
    "csName": "Giordana Konrath",
    "entryDate": "2025-08-09T00:00:00.000Z",
    "renewalDate": "2026-08-09T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 116400,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": "Telefone: 14 996804052 | CS FAZER CONTATO PARA REUNIÃO DE ACOMPANHAMENTO",
    "meetings": []
  },
  {
    "name": "YGOR ANTONY BATISTA",
    "company": null,
    "product": "Club",
    "csName": null,
    "entryDate": "2025-08-18T00:00:00.000Z",
    "renewalDate": "2026-08-18T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 90000,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": "VERIFICAR TELEFONE E FAZER CONTATO. ACIONAR O DOM",
    "meetings": []
  },
  {
    "name": "Formular",
    "company": null,
    "product": "Club",
    "csName": null,
    "entryDate": "2025-09-22T00:00:00.000Z",
    "renewalDate": "2026-09-22T00:00:00.000Z",
    "status": "cancelado",
    "contractValue": 116800,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": null,
    "meetings": []
  },
  {
    "name": "Majoris",
    "company": null,
    "product": "Club",
    "csName": null,
    "entryDate": "2025-09-25T00:00:00.000Z",
    "renewalDate": "2026-09-25T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 116400,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": null,
    "meetings": []
  },
  {
    "name": "Perfect Skin",
    "company": null,
    "product": "Club",
    "csName": "Camila Leite",
    "entryDate": "2025-10-08T00:00:00.000Z",
    "renewalDate": "2026-10-08T00:00:00.000Z",
    "status": "em_risco",
    "contractValue": 87300,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": "E-mail: apsa.araujo@hotmail.com",
    "meetings": []
  },
  {
    "name": "Souly",
    "company": null,
    "product": "Club",
    "csName": "Camila Leite",
    "entryDate": "2025-10-29T00:00:00.000Z",
    "renewalDate": "2026-10-29T00:00:00.000Z",
    "status": "pausado",
    "contractValue": 106000,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": null,
    "meetings": []
  },
  {
    "name": "Raquel Moraes",
    "company": "Fastpace",
    "product": "Club",
    "csName": "Camila Leite",
    "entryDate": "2025-12-01T00:00:00.000Z",
    "renewalDate": "2026-12-01T00:00:00.000Z",
    "status": "em_risco",
    "contractValue": 110000,
    "lastContactAt": "2026-06-09T00:00:00.000Z",
    "nextContactAt": null,
    "notes": "E-mail: raquelmoraes@hormail.com | Telefone: 81 99925-0098 | Status atual: SOLICITOU CANCELAMENTO | 4 encontro(s) marcados como feitos (sem data registrada na planilha)",
    "meetings": []
  },
  {
    "name": "Artstones",
    "company": null,
    "product": "Club",
    "csName": null,
    "entryDate": "2025-12-02T00:00:00.000Z",
    "renewalDate": "2026-12-02T00:00:00.000Z",
    "status": "cancelado",
    "contractValue": 110000,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": null,
    "meetings": []
  },
  {
    "name": "Melfit",
    "company": null,
    "product": "Club",
    "csName": null,
    "entryDate": "2025-12-09T00:00:00.000Z",
    "renewalDate": "2026-12-09T00:00:00.000Z",
    "status": "cancelado",
    "contractValue": 129600,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": null,
    "meetings": []
  },
  {
    "name": "Arcane",
    "company": null,
    "product": "Club",
    "csName": null,
    "entryDate": "2025-12-10T00:00:00.000Z",
    "renewalDate": "2026-12-10T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 117000,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": null,
    "meetings": []
  },
  {
    "name": "Totanka",
    "company": null,
    "product": "Club",
    "csName": "Camila Leite",
    "entryDate": "2025-12-10T00:00:00.000Z",
    "renewalDate": "2026-12-10T00:00:00.000Z",
    "status": "cancelado",
    "contractValue": 117000,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": null,
    "meetings": []
  },
  {
    "name": "Scardua",
    "company": null,
    "product": "Club",
    "csName": null,
    "entryDate": "2026-01-28T00:00:00.000Z",
    "renewalDate": "2027-01-28T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 116800,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": null,
    "meetings": []
  },
  {
    "name": "Rosilene Moura",
    "company": "Dyusar",
    "product": "Club",
    "csName": "Camila Leite",
    "entryDate": "2026-02-16T00:00:00.000Z",
    "renewalDate": "2027-02-16T00:00:00.000Z",
    "status": "em_risco",
    "contractValue": 126000,
    "lastContactAt": "2026-05-28T00:00:00.000Z",
    "nextContactAt": null,
    "notes": "E-mail: dyusar@yahoo.com | Telefone: ‪19 99663‑7425‬ | Status atual: SOLICITOU CANCELAMENTO | 2 encontro(s) marcados como feitos (sem data registrada na planilha)",
    "meetings": []
  },
  {
    "name": "Diego\nDouglas",
    "company": "Harmony Empório Natural",
    "product": "Club",
    "csName": "Giordana Konrath",
    "entryDate": "2026-03-16T00:00:00.000Z",
    "renewalDate": "2027-03-16T00:00:00.000Z",
    "status": "ativo",
    "contractValue": 130000,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": "E-mail: contato.diegoalmeida@icloud\ngruponutriworld@gmail.com | Telefone: 11 999436476 \n11 914892788",
    "meetings": []
  },
  {
    "name": "Vinicius Assad",
    "company": "José Marques de Jesus Assad Maciel Parente",
    "product": "Club",
    "csName": "Camila Leite",
    "entryDate": "2026-03-16T00:00:00.000Z",
    "renewalDate": "2027-03-16T00:00:00.000Z",
    "status": "em_risco",
    "contractValue": 154800,
    "lastContactAt": "2026-05-04T00:00:00.000Z",
    "nextContactAt": null,
    "notes": "E-mail: viniciusassad@hotmail.com | Telefone: ‪98 98432‑7957‬ | Status atual: NÃO RESPONDE | 2 encontro(s) marcados como feitos (sem data registrada na planilha)",
    "meetings": []
  },
  {
    "name": "Mayui Fit",
    "company": null,
    "product": "Club",
    "csName": "Camila Leite",
    "entryDate": "2026-03-17T00:00:00.000Z",
    "renewalDate": "2027-03-17T00:00:00.000Z",
    "status": "cancelado",
    "contractValue": 127000,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": null,
    "meetings": []
  },
  {
    "name": "FRANCISLAINE",
    "company": null,
    "product": "Club",
    "csName": "Camila Leite",
    "entryDate": "2026-04-01T00:00:00.000Z",
    "renewalDate": "2027-04-01T00:00:00.000Z",
    "status": "cancelado",
    "contractValue": 100000,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": "2 encontro(s) marcados como feitos (sem data registrada na planilha)",
    "meetings": []
  },
  {
    "name": "TNC & CO",
    "company": null,
    "product": "Club",
    "csName": "Giordana Konrath",
    "entryDate": "2026-04-09T00:00:00.000Z",
    "renewalDate": "2027-04-09T00:00:00.000Z",
    "status": "cancelado",
    "contractValue": 139320,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": null,
    "meetings": []
  },
  {
    "name": "KAIABI",
    "company": null,
    "product": "Club",
    "csName": null,
    "entryDate": "2026-04-28T00:00:00.000Z",
    "renewalDate": "2027-04-28T00:00:00.000Z",
    "status": "ativo",
    "contractValue": null,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": null,
    "meetings": []
  },
  {
    "name": "Davi Luis\nFelipe",
    "company": "Blessy",
    "product": "Club",
    "csName": "Giordana Konrath",
    "entryDate": "2026-09-09T18:48:15.968Z",
    "renewalDate": null,
    "status": "ativo",
    "contractValue": 116800,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": "E-mail: davi@useblessy.com.br\nfelipe@useblessy.com.br | Telefone: 24 993269059\n99 981229510",
    "meetings": []
  },
  {
    "name": "Gabriel",
    "company": "Wellshot",
    "product": "Club",
    "csName": "Giordana Konrath",
    "entryDate": "2026-09-09T18:48:15.969Z",
    "renewalDate": null,
    "status": "pausado",
    "contractValue": 30000,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": "E-mail: baueb2015@gmail.com | Telefone: 11 989140632",
    "meetings": []
  },
  {
    "name": "Diego",
    "company": "Igummy",
    "product": "Club",
    "csName": "Giordana Konrath",
    "entryDate": "2026-09-09T18:48:15.969Z",
    "renewalDate": null,
    "status": "pausado",
    "contractValue": 94800,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": "E-mail: dm.cabrall07@gmail.com | Telefone: 11 973375105",
    "meetings": []
  },
  {
    "name": "PLK",
    "company": null,
    "product": "Club",
    "csName": null,
    "entryDate": "2026-09-09T18:48:15.969Z",
    "renewalDate": null,
    "status": "pausado",
    "contractValue": 80000,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": null,
    "meetings": []
  },
  {
    "name": "Vitallini suplementos",
    "company": null,
    "product": "Club",
    "csName": null,
    "entryDate": "2026-09-09T18:48:15.969Z",
    "renewalDate": null,
    "status": "ativo",
    "contractValue": 94800,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": null,
    "meetings": []
  },
  {
    "name": "WP Lab",
    "company": null,
    "product": "Club",
    "csName": null,
    "entryDate": "2026-09-09T18:48:15.969Z",
    "renewalDate": null,
    "status": "pausado",
    "contractValue": 80000,
    "lastContactAt": null,
    "nextContactAt": null,
    "notes": null,
    "meetings": []
  }
];

export async function POST() {
  const user = await requireUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  const csUsers = await prisma.user.findMany({
    where: { email: { in: Object.values(CS_EMAIL_MAP) } },
    select: { id: true, email: true },
  });
  const emailToId = new Map(csUsers.map((u) => [u.email, u.id]));

  const deletedCount = await prisma.customer.deleteMany({});

  const results: { name: string; company: string | null; id: string; meetingsCreated: number }[] = [];

  for (const row of CUSTOMERS) {
    const csEmail = CS_EMAIL_MAP[normalize(row.csName)];
    const csId = (csEmail && emailToId.get(csEmail)) || user.id;

    const customer = await prisma.customer.create({
      data: {
        name: row.name,
        company: row.company,
        product: row.product,
        csId,
        entryDate: new Date(row.entryDate),
        renewalDate: row.renewalDate ? new Date(row.renewalDate) : null,
        status: row.status as CustomerStatus,
        contractValue: row.contractValue,
        lastContactAt: row.lastContactAt ? new Date(row.lastContactAt) : null,
        nextContactAt: row.nextContactAt ? new Date(row.nextContactAt) : null,
        notes: row.notes,
      },
    });

    for (const m of row.meetings) {
      await prisma.customerMeeting.create({
        data: {
          customerId: customer.id,
          type: "individual",
          label: m.label,
          sequence: m.sequence,
          date: new Date(m.date),
          createdById: user.id,
        },
      });
    }

    results.push({ name: row.name, company: row.company, id: customer.id, meetingsCreated: row.meetings.length });
  }

  const finalCount = await prisma.customer.count();
  const finalMeetingCount = await prisma.customerMeeting.count();

  return NextResponse.json({
    deletedPrevious: deletedCount.count,
    created: results.length,
    finalCustomerCount: finalCount,
    finalMeetingCount,
    results,
  });
}
