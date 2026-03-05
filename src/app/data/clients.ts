import { Client } from '@/app/components/ClientSidebar';

export interface ClientWithContact extends Client {
  email?: string;
  phone?: string;
}

export const clientsData: ClientWithContact[] = [
  {
    id: '22',
    name: '(MCI PLUS) AEG MEDIA / Nordeste Clube',
    status: 'CRÍTICO',
    riskLevel: 20,
    lastMessage: 'Andreia: @32444250112144 Boa tarde ! Consegue retornar hoje ainda ?',
    lastMessageTime: '26/02',
    email: 'contato@nordesteclube.com.br',
    phone: '+55 11 98765-4321',
  },
  {
    id: '23',
    name: 'Belloscar <> AEG',
    status: 'ALTO',
    riskLevel: 35,
    lastMessage: 'Andressa Bellos Car: Bom dia Gabriel! Estou aguardando liberar o numero!',
    lastMessageTime: '26/02',
    email: 'contato@belloscar.com.br',
    phone: '+55 21 99876-5432',
  },
  {
    id: '24',
    name: 'Auto X Veículos',
    status: 'MÉDIO',
    riskLevel: 60,
    lastMessage: 'Auto X Veiculos: vocês tem alguma atualização do venda.ia?',
    lastMessageTime: '26/02',
    email: 'contato@autoxveiculos.com.br',
    phone: '+55 85 97654-3210',
  },
  {
    id: '25',
    name: 'Primos Protege (AEG / Primos Protege)',
    status: 'MÉDIO',
    riskLevel: 60,
    lastMessage: 'Primos Protege: Aguardando o link / O trafégo parou?',
    lastMessageTime: '26/02',
    email: 'contato@primosprotege.com.br',
    phone: '+55 31 98901-2345',
  },
  {
    id: '26',
    name: 'Unimais <> AEG',
    status: 'BAIXO',
    riskLevel: 85,
    lastMessage: 'Lucas Albuquerque: Bom dia Elane! Preciso do contato desse pessoal pra gente poder configurar o pixel do site vocês.',
    lastMessageTime: '26/02',
    email: 'contato@unimais.com.br',
    phone: '+55 48 97234-5678',
  },
  {
    id: '20',
    name: '(MCI PLUS) Auto Energia Baterias <> AEG MEDIA',
    status: 'CRÍTICO',
    riskLevel: 90,
    lastMessage: 'Paralisação da campanha por falta de pagamento',
    lastMessageTime: '18/02',
    email: 'financeiro@autoenergia.com.br',
    phone: '+55 71 98567-1234',
  },
  {
    id: '19',
    name: '[MCI PLUS] AEG <> MARTOLI',
    status: 'MÉDIO',
    riskLevel: 50,
    lastMessage: 'Enviar convites que estavam pendentes (responsável indefinido)',
    lastMessageTime: '31/10',
    email: 'contato@martoli.com.br',
    phone: '+55 19 97890-1234',
  },
  {
    id: '18',
    name: '[MCI FULL] Cansadão Automóveis <> AEG MEDIA',
    status: 'MÉDIO',
    riskLevel: 50,
    lastMessage: 'Tivemos uma queda de leads. Houve alguma mudança de estratégia?',
    lastMessageTime: '24/02',
    email: 'contato@cansadaoauto.com.br',
    phone: '+55 41 99123-4567',
  },
  {
    id: '17',
    name: '(MCI PLUS) Nordeste Clube',
    status: 'CRÍTICO',
    riskLevel: 90,
    lastMessage: 'Mensagem não chegou; teste com print comprovando a falha',
    lastMessageTime: '24/02',
    email: 'suporte@nordesteclube.com.br',
    phone: '+55 81 98234-5678',
  },
  {
    id: '16',
    name: 'COMERCIAL INTERNO - SC CLUBE',
    status: 'ALTO',
    riskLevel: 30,
    lastMessage: 'Vamos tirar a iso e colocar a susep - Sem confirmação de conclusão',
    lastMessageTime: '24/02',
    email: 'comercial@scclube.com.br',
    phone: '+55 47 97345-6789',
  },
  {
    id: '15',
    name: 'MCI PLUS - auto x veículos',
    status: 'MÉDIO',
    riskLevel: 50,
    lastMessage: 'Boa tarde pessoal, mais um pra subir',
    lastMessageTime: '23/02',
    email: 'contato@mciplusauto.com.br',
    phone: '+55 11 98456-7890',
  },
];

export const getClientById = (id: string) => {
  return clientsData.find((client) => client.id === id);
};
