import { Client } from '@/app/components/ClientSidebar';

export interface ClientWithContact extends Client {
  email?: string;
  phone?: string;
}

export const clientsData: ClientWithContact[] = [
  {
    id: '1',
    name: 'MCI PLUS - auto x veículos',
    status: 'CRÍTICO',
    riskLevel: 90,
    lastMessage: 'Boa tarde pessoal, mais um pra subir',
    lastMessageTime: '23/02',
    email: 'fernando.silva@mciplus.com.br',
    phone: '+55 11 98765-4321',
  },
  {
    id: '2',
    name: 'TechFlow Solutions',
    status: 'CRÍTICO',
    riskLevel: 85,
    lastMessage: 'Precisa de revisão urgente',
    lastMessageTime: '26/02',
    email: 'maria.santos@techflow.io',
    phone: '+55 21 99876-5432',
  },
  {
    id: '3',
    name: 'GlobalPay Inc',
    status: 'ALTO',
    riskLevel: 72,
    lastMessage: 'Aguardando feedback do cliente',
    lastMessageTime: '25/02',
    email: 'joao.pedro@globalpay.com',
    phone: '+55 85 97654-3210',
  },
  {
    id: '4',
    name: 'CloudVision Corp',
    status: 'ALTO',
    riskLevel: 68,
    lastMessage: 'Reunião agendada para terça',
    lastMessageTime: '24/02',
    email: 'lucas.costa@cloudvision.ai',
    phone: '+55 31 98901-2345',
  },
  {
    id: '5',
    name: 'DataStream Analytics',
    status: 'MÉDIO',
    riskLevel: 55,
    lastMessage: 'Análise em progresso',
    lastMessageTime: '26/02',
    email: 'patricia.gomes@datastream.br',
    phone: '+55 48 97234-5678',
  },
  {
    id: '6',
    name: 'SecureNet Systems',
    status: 'MÉDIO',
    riskLevel: 45,
    lastMessage: 'Situação sob controle',
    lastMessageTime: '25/02',
    email: 'daniela.rocha@securenet.com',
    phone: '+55 71 98567-1234',
  },
  {
    id: '7',
    name: 'InnovateLabs',
    status: 'BAIXO',
    riskLevel: 25,
    lastMessage: 'Tudo certo por aqui',
    lastMessageTime: '20/02',
    email: 'rafael.oliveira@innovatelabs.io',
    phone: '+55 19 97890-1234',
  },
  {
    id: '8',
    name: 'PowerTech Enterprises',
    status: 'BAIXO',
    riskLevel: 15,
    lastMessage: 'Cliente satisfeito',
    lastMessageTime: '18/02',
    email: 'gustavo.alves@powertech.com.br',
    phone: '+55 41 99123-4567',
  },
];

export const getClientById = (id: string) => {
  return clientsData.find((client) => client.id === id);
};
