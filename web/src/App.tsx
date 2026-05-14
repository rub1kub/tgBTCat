import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useTonAddress, useTonConnectModal, useTonConnectUI } from '@tonconnect/ui-react';
import {
  Activity,
  ArrowRight,
  Clock3,
  Copy,
  ExternalLink,
  Flame,
  Gauge,
  Landmark,
  Plus,
  Send,
  Settings2,
  ShieldCheck,
  Vote,
  Wallet,
} from 'lucide-react';
import { proposalRows, type ProposalRow, type ProposalStatus } from './data/proposals';
import {
  addressBooks,
  contractLabels,
  contractRoles,
  socialLinks,
  type ContractKey,
  type NetworkKey,
} from './ton/contracts';
import {
  buildGlobalFeeProposalTransaction,
  buildVoteTransaction,
  formatVotes,
  resolveJettonWalletAddress,
  shortAddress,
  unixHoursFromNow,
  type TonConnectTransaction,
  type VoteSide,
} from './ton/transactions';

type PageKey = 'home' | 'tokenomics' | 'roadmap' | 'vote' | 'contracts';
type GovernanceMode = 'cast' | 'propose';
type LanguageKey = 'en' | 'ru';
type WalletBindingState = 'idle' | 'loading' | 'ready' | 'manual' | 'error';

interface VoteFormState {
  voterJettonWallet: string;
  proposalId: string;
  side: VoteSide;
  jettonAmount: string;
  gasTon: string;
  forwardTon: string;
}

interface ProposalFormState {
  queryId: string;
  buyFeePercent: string;
  sellFeePercent: string;
  votingEndsAt: string;
  gasTon: string;
}

const navItemIds: PageKey[] = ['home', 'tokenomics', 'roadmap', 'vote', 'contracts'];

const contractOrder: ContractKey[] = [
  'governor',
  'jettonMaster',
  'governorVoteJettonWallet',
  'feeController',
  'walletFeeRegistry',
  'dexRegistry',
  'treasury',
  'eventController',
  'feeTreasury',
];

const copyByLanguage = {
  en: {
    nav: {
      home: 'Home',
      tokenomics: 'Tokenomics',
      roadmap: 'Roadmap',
      vote: 'Vote',
      contracts: 'Contracts',
    },
    common: {
      connect: 'Connect',
      language: 'Language',
      ready: 'Ready',
      pending: 'Pending',
      address: 'Address',
      walletNotConnected: 'Wallet not connected',
      buildPayload: 'Build payload',
      send: 'Send',
      create: 'Create',
    },
    hero: {
      title: 'Telegram BTC Cat',
      text: 'A DAO-governed TON jetton for the tgBTC narrative. Holders commit tokens on-chain to move fee policy, wallet-specific rules, treasury actions, and community events.',
      vote: 'Vote on-chain',
      tokenomics: 'Tokenomics',
      metrics: [
        ['Contracts', '9', 'current surface'],
        ['Votes', '', 'sample governance'],
        ['Fees', '0-100%', 'DAO-controlled'],
        ['Tests', '95', 'Acton gate'],
      ],
      featureTitle: 'Fees are policy, not admin settings.',
      featureText:
        'Buy and sell fees can move from zero to full capture through proposals. Wallet-specific rules let the DAO respond to campaigns, bad actors, market events, or community games without replacing the token.',
      network: 'Network',
      governor: 'Governor',
      jettonMaster: 'Jetton Master',
      treasury: 'DAO Treasury',
    },
    tokenomics: {
      title: 'Tokenomics built for visible governance.',
      text: 'Every vote is a committed transfer. The more tokens a holder sends into governance, the more weight they place behind the decision.',
      supplyLabel: 'Supply model',
      supplyValue: 'DAO launch',
      allocations: [
        { label: 'Liquidity', value: 45, detail: 'DEX depth and market operations' },
        { label: 'DAO Treasury', value: 25, detail: 'governance reserve and execution budget' },
        { label: 'Events', value: 15, detail: 'community campaigns and on-chain rituals' },
        { label: 'Strategic Reserve', value: 10, detail: 'partnerships, listings, emergency runway' },
        { label: 'Launch Ops', value: 5, detail: 'deployment, verification, and infrastructure' },
      ],
      principles: [
        ['Irreversible votes', 'Vote weight is paid into governance and does not return.'],
        ['0-100% fee range', 'Global and wallet-specific fees are controlled by proposals.'],
        ['Treasury routes', 'DAO execution can move TON, jettons, and event state through contracts.'],
      ],
    },
    roadmap: {
      title: 'Roadmap',
      text: 'From local protocol gate to public voting surface, then liquidity, launch, and recurring DAO seasons.',
      openVote: 'Open vote page',
      phases: [
        {
          phase: '01',
          title: 'Protocol',
          status: 'Live locally',
          detail: 'Jetton master, fee-aware wallets, irreversible governance, treasury, events, and controllers.',
        },
        {
          phase: '02',
          title: 'Testnet',
          status: 'Active',
          detail: 'Deploy, verify, connect TON Connect flows, expose proposal and transaction previews.',
        },
        {
          phase: '03',
          title: 'Launch',
          status: 'Queued',
          detail: 'Finalize metadata, seed liquidity, publish socials, and open the first community votes.',
        },
        {
          phase: '04',
          title: 'DAO Expansion',
          status: 'Planned',
          detail: 'Wallet-specific fee campaigns, treasury routes, event seasons, and live vote explorer.',
        },
      ],
    },
    vote: {
      title: 'On-chain voting',
      text: 'Connect TON wallet, select a proposal, send tgBTCat into governance, and review the exact transaction before signing.',
      cast: 'Cast',
      propose: 'Propose',
      votesTitle: 'Votes',
      routes: 'routes',
      castTitle: 'Cast vote',
      jettonTransfer: 'Jetton transfer',
      selectedProposal: 'Selected proposal',
      voterJettonWallet: 'Voter jetton wallet',
      walletPlaceholder: 'Auto-filled after Ton Connect',
      proposalId: 'Proposal ID',
      amount: 'Amount',
      gasTon: 'Gas TON',
      forwardTon: 'Forward TON',
      flow: ['Connect wallet', 'Jetton wallet binds automatically', 'Choose vote weight', 'Send vote'],
      bindingIdle: 'Connect wallet to detect your tgBTCat jetton wallet.',
      bindingLoading: 'Detecting jetton wallet on TON...',
      bindingReady: 'Jetton wallet bound from Ton Connect owner.',
      bindingManual: 'Manual jetton wallet value is used.',
      createTitle: 'Create fee proposal',
      globalRoute: 'Global route',
      queryId: 'Query ID',
      votingEnds: 'Voting ends',
      buyFee: 'Buy fee %',
      sellFee: 'Sell fee %',
      transaction: 'Transaction',
      noTransaction: 'No transaction prepared',
      votePrepared: 'Vote transaction prepared',
      voteSent: 'Vote transaction sent to wallet',
      proposalPrepared: 'Proposal transaction prepared',
      proposalSent: 'Proposal transaction sent to wallet',
      connectRequired: 'Connect a wallet before building a vote transaction',
      governorRequired: 'Governor is not deployed',
    },
    contracts: {
      title: 'Contract registry',
      text: 'Current address book for the DAO surface. Mainnet fields stay closed until the launch deployment is final.',
    },
    status: {
      open: 'Open',
      passed: 'Passed',
      queued: 'Queued',
      executed: 'Executed',
    } satisfies Record<ProposalStatus, string>,
    sides: {
      1: 'FOR',
      2: 'AGAINST',
      3: 'ABSTAIN',
    } satisfies Record<VoteSide, string>,
    proposals: {
      0: {
        title: 'Set global launch fees',
        endsIn: '17h 42m',
        execution: 'Fee Controller',
      },
      1: {
        title: 'Apply wallet-specific sell fee',
        endsIn: 'closed',
        execution: 'Wallet Fee Registry',
      },
      2: {
        title: 'Open Satoshi Council event',
        endsIn: 'closed',
        execution: 'Event Controller',
      },
      3: {
        title: 'Top up DAO liquidity reserve',
        endsIn: 'executed',
        execution: 'DAO Treasury',
      },
    },
  },
  ru: {
    nav: {
      home: 'Главная',
      tokenomics: 'Токеномика',
      roadmap: 'Роадмапа',
      vote: 'Голосование',
      contracts: 'Контракты',
    },
    common: {
      connect: 'Подключить',
      language: 'Язык',
      ready: 'Готово',
      pending: 'Скоро',
      address: 'Адрес',
      walletNotConnected: 'Кошелек не подключен',
      buildPayload: 'Собрать транзакцию',
      send: 'Отправить',
      create: 'Создать',
    },
    hero: {
      title: 'Telegram BTC Cat',
      text: 'DAO jetton на TON под нарратив tgBTC. Держатели безвозвратно отправляют токены в governance, чтобы менять комиссии, правила для кошельков, казну и события комьюнити.',
      vote: 'Голосовать ончейн',
      tokenomics: 'Токеномика',
      metrics: [
        ['Контракты', '9', 'текущая поверхность'],
        ['Голоса', '', 'пример governance'],
        ['Комиссии', '0-100%', 'управляет DAO'],
        ['Тесты', '95', 'Acton gate'],
      ],
      featureTitle: 'Комиссии - это политика DAO, а не админская настройка.',
      featureText:
        'Комиссии покупки и продажи могут двигаться от нуля до полного захвата через предложения. Отдельные правила для кошельков позволяют DAO реагировать на кампании, плохих актеров, рыночные события и игры комьюнити без замены токена.',
      network: 'Сеть',
      governor: 'Governor',
      jettonMaster: 'Jetton Master',
      treasury: 'DAO Treasury',
    },
    tokenomics: {
      title: 'Токеномика под видимое управление.',
      text: 'Каждый голос - это отправка токенов в governance. Чем больше токенов держатель отправляет, тем больше веса он ставит за решение.',
      supplyLabel: 'Модель supply',
      supplyValue: 'DAO launch',
      allocations: [
        { label: 'Ликвидность', value: 45, detail: 'DEX depth и рыночные операции' },
        { label: 'DAO Treasury', value: 25, detail: 'резерв governance и бюджет исполнения' },
        { label: 'Ивенты', value: 15, detail: 'кампании комьюнити и ончейн-ритуалы' },
        { label: 'Стратегический резерв', value: 10, detail: 'партнерства, листинги, emergency runway' },
        { label: 'Launch Ops', value: 5, detail: 'деплой, верификация и инфраструктура' },
      ],
      principles: [
        ['Безвозвратные голоса', 'Вес голоса платится в governance и не возвращается.'],
        ['Комиссии 0-100%', 'Общие и кошельковые комиссии контролируются предложениями.'],
        ['Маршруты казны', 'DAO execution может двигать TON, jetton и состояние ивентов через контракты.'],
      ],
    },
    roadmap: {
      title: 'Роадмапа',
      text: 'От локального protocol gate к публичному голосованию, затем ликвидность, запуск и регулярные DAO-сезоны.',
      openVote: 'Открыть голосование',
      phases: [
        {
          phase: '01',
          title: 'Protocol',
          status: 'Локально готов',
          detail: 'Jetton master, fee-aware wallets, безвозвратное governance, treasury, ивенты и контроллеры.',
        },
        {
          phase: '02',
          title: 'Testnet',
          status: 'Активно',
          detail: 'Деплой, верификация, TON Connect flows, превью proposal и транзакций.',
        },
        {
          phase: '03',
          title: 'Launch',
          status: 'В очереди',
          detail: 'Финализировать metadata, засеять ликвидность, опубликовать socials и открыть первые community votes.',
        },
        {
          phase: '04',
          title: 'DAO Expansion',
          status: 'План',
          detail: 'Кампании кошельковых комиссий, treasury routes, event seasons и live vote explorer.',
        },
      ],
    },
    vote: {
      title: 'Ончейн-голосование',
      text: 'Подключи TON wallet, выбери proposal, отправь tgBTCat в governance и проверь точную транзакцию перед подписью.',
      cast: 'Голос',
      propose: 'Proposal',
      votesTitle: 'Голосования',
      routes: 'маршрута',
      castTitle: 'Отдать голос',
      jettonTransfer: 'Jetton transfer',
      selectedProposal: 'Выбранный proposal',
      voterJettonWallet: 'Voter jetton wallet',
      walletPlaceholder: 'Заполнится после Ton Connect',
      proposalId: 'Proposal ID',
      amount: 'Кол-во токенов',
      gasTon: 'Gas TON',
      forwardTon: 'Forward TON',
      flow: ['Подключи кошелек', 'Jetton wallet привяжется сам', 'Выбери вес голоса', 'Отправь голос'],
      bindingIdle: 'Подключи кошелек, чтобы найти твой tgBTCat jetton wallet.',
      bindingLoading: 'Ищу jetton wallet в TON...',
      bindingReady: 'Jetton wallet привязан по owner-адресу из Ton Connect.',
      bindingManual: 'Используется вручную заданный jetton wallet.',
      createTitle: 'Создать proposal комиссий',
      globalRoute: 'Global route',
      queryId: 'Query ID',
      votingEnds: 'Voting ends',
      buyFee: 'Комиссия покупки %',
      sellFee: 'Комиссия продажи %',
      transaction: 'Транзакция',
      noTransaction: 'Транзакция еще не собрана',
      votePrepared: 'Транзакция голоса собрана',
      voteSent: 'Транзакция голоса отправлена в wallet',
      proposalPrepared: 'Proposal-транзакция собрана',
      proposalSent: 'Proposal-транзакция отправлена в wallet',
      connectRequired: 'Подключи кошелек перед сборкой vote-транзакции',
      governorRequired: 'Governor еще не задеплоен',
    },
    contracts: {
      title: 'Реестр контрактов',
      text: 'Текущая адресная книга DAO. Mainnet поля закрыты до финального launch deployment.',
    },
    status: {
      open: 'Открыто',
      passed: 'Принято',
      queued: 'В очереди',
      executed: 'Исполнено',
    } satisfies Record<ProposalStatus, string>,
    sides: {
      1: 'ЗА',
      2: 'ПРОТИВ',
      3: 'ВОЗДЕРЖ.',
    } satisfies Record<VoteSide, string>,
    proposals: {
      0: {
        title: 'Установить launch-комиссии',
        endsIn: '17ч 42м',
        execution: 'Fee Controller',
      },
      1: {
        title: 'Включить sell fee для кошелька',
        endsIn: 'закрыто',
        execution: 'Wallet Fee Registry',
      },
      2: {
        title: 'Открыть Satoshi Council event',
        endsIn: 'закрыто',
        execution: 'Event Controller',
      },
      3: {
        title: 'Пополнить reserve ликвидности DAO',
        endsIn: 'исполнено',
        execution: 'DAO Treasury',
      },
    },
  },
} as const;

type AppCopy = (typeof copyByLanguage)[LanguageKey];

function detectLanguage(): LanguageKey {
  if (typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('ru')) {
    return 'ru';
  }
  return 'en';
}

export default function App() {
  const [network, setNetwork] = useState<NetworkKey>('testnet');
  const [activePage, setActivePage] = useState<PageKey>('home');
  const [language, setLanguage] = useState<LanguageKey>(() => detectLanguage());
  const [isScrolled, setIsScrolled] = useState(false);
  const [governanceMode, setGovernanceMode] = useState<GovernanceMode>('cast');
  const [selectedProposalId, setSelectedProposalId] = useState(0);
  const [transactionPreview, setTransactionPreview] = useState<TonConnectTransaction | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [walletBinding, setWalletBinding] = useState<WalletBindingState>('idle');
  const [walletBindingMessage, setWalletBindingMessage] = useState('');
  const [tonConnectUI] = useTonConnectUI();
  const { open: openConnectModal } = useTonConnectModal();
  const connectedAddress = useTonAddress();

  const t = copyByLanguage[language];
  const addressBook = addressBooks[network];
  const selectedProposal = proposalRows.find((proposal) => proposal.id === selectedProposalId) ?? proposalRows[0];
  const navItems = useMemo(
    () => navItemIds.map((id) => ({ id, label: t.nav[id] })),
    [t.nav],
  );
  const activeNavIndex = Math.max(0, navItemIds.indexOf(activePage));
  const effectiveWalletBinding = connectedAddress && addressBook.addresses.jettonMaster ? walletBinding : 'idle';
  const effectiveWalletBindingMessage = effectiveWalletBinding === 'idle' ? '' : walletBindingMessage;

  const [voteForm, setVoteForm] = useState<VoteFormState>({
    voterJettonWallet: '',
    proposalId: '0',
    side: 1,
    jettonAmount: '1000',
    gasTon: '0.3',
    forwardTon: '0.05',
  });

  const [proposalForm, setProposalForm] = useState<ProposalFormState>({
    queryId: '1',
    buyFeePercent: '1',
    sellFeePercent: '2',
    votingEndsAt: unixHoursFromNow(24),
    gasTon: '0.05',
  });

  const totalVotes = useMemo(
    () => proposalRows.reduce((sum, proposal) => sum + proposal.forVotes + proposal.againstVotes + proposal.abstainVotes, 0),
    [],
  );

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activePage]);

  useEffect(() => {
    const jettonMaster = addressBook.addresses.jettonMaster;
    if (!connectedAddress || !jettonMaster) {
      return;
    }

    let cancelled = false;

    const bindJettonWallet = async () => {
      setWalletBinding('loading');
      setWalletBindingMessage('');
      try {
        const walletAddress = await resolveJettonWalletAddress({
          network,
          jettonMaster,
          ownerAddress: connectedAddress,
        });
        if (cancelled) {
          return;
        }
        setVoteForm((current) => ({ ...current, voterJettonWallet: walletAddress }));
        setWalletBinding('ready');
      } catch (error) {
        if (cancelled) {
          return;
        }
        setWalletBinding('error');
        setWalletBindingMessage(formatError(error));
      }
    };

    void bindJettonWallet();

    return () => {
      cancelled = true;
    };
  }, [addressBook.addresses.jettonMaster, connectedAddress, network]);

  const openVote = () => {
    setActivePage('vote');
    setGovernanceMode('cast');
  };

  const buildVotePreview = () => {
    clearFeedback();
    try {
      const governorAddress = requireAddress(addressBook.addresses.governor, t.vote.governorRequired);
      const responseAddress = requireAddress(connectedAddress, t.vote.connectRequired);
      const transaction = buildVoteTransaction({
        ...voteForm,
        governorAddress,
        responseAddress,
      });
      setTransactionPreview(transaction);
      setStatusMessage(t.vote.votePrepared);
    } catch (error) {
      setErrorMessage(formatError(error));
    }
  };

  const sendVote = async () => {
    const transaction = transactionPreview;
    if (!transaction) {
      buildVotePreview();
      return;
    }
    await sendPreparedTransaction(transaction, t.vote.voteSent);
  };

  const buildProposalPreview = () => {
    clearFeedback();
    try {
      const governorAddress = requireAddress(addressBook.addresses.governor, t.vote.governorRequired);
      const transaction = buildGlobalFeeProposalTransaction({
        ...proposalForm,
        governorAddress,
      });
      setTransactionPreview(transaction);
      setStatusMessage(t.vote.proposalPrepared);
    } catch (error) {
      setErrorMessage(formatError(error));
    }
  };

  const sendProposal = async () => {
    const transaction = transactionPreview;
    if (!transaction) {
      buildProposalPreview();
      return;
    }
    await sendPreparedTransaction(transaction, t.vote.proposalSent);
  };

  const updateVoteForm = (patch: Partial<VoteFormState>) => {
    if (patch.voterJettonWallet !== undefined) {
      setWalletBinding('manual');
      setWalletBindingMessage('');
    }
    setVoteForm((current) => ({ ...current, ...patch }));
  };

  const sendPreparedTransaction = async (transaction: TonConnectTransaction, success: string) => {
    clearFeedback(false);
    try {
      await tonConnectUI.sendTransaction(transaction);
      setStatusMessage(success);
    } catch (error) {
      setErrorMessage(formatError(error));
    }
  };

  const clearFeedback = (clearPreview = true) => {
    setErrorMessage('');
    setStatusMessage('');
    if (clearPreview) {
      setTransactionPreview(null);
    }
  };

  return (
    <div className="app-shell">
      <header className={isScrolled ? 'topbar is-scrolled' : 'topbar'}>
        <div className="topbar-inner">
          <button className="brand" type="button" onClick={() => setActivePage('home')}>
            <img src="/logo-transparent.png" alt="" />
            <strong>TG BTC Cat</strong>
          </button>

          <nav
            className="main-nav"
            aria-label="Primary"
            style={{ '--active-offset': `${activeNavIndex * 100}%` } as CSSProperties}
          >
            {navItems.map((item) => (
              <button
                key={item.id}
                className={activePage === item.id ? 'nav-item is-active' : 'nav-item'}
                type="button"
                onClick={() => setActivePage(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="topbar-actions">
            <div className="language-switch" aria-label={t.common.language}>
              {(['ru', 'en'] as const).map((item) => (
                <button
                  key={item}
                  className={language === item ? 'is-active' : ''}
                  type="button"
                  onClick={() => setLanguage(item)}
                >
                  {item.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="network-switch" aria-label="Network">
              {(['testnet', 'mainnet'] as const).map((item) => (
                <button
                  key={item}
                  className={network === item ? 'is-active' : ''}
                  type="button"
                  onClick={() => setNetwork(item)}
                >
                  {addressBooks[item].label}
                </button>
              ))}
            </div>
            <button
              className="wallet-button"
              type="button"
              onClick={() => {
                if (connectedAddress) {
                  setWalletBinding('idle');
                  setWalletBindingMessage('');
                  setVoteForm((current) => ({ ...current, voterJettonWallet: '' }));
                  void tonConnectUI.disconnect();
                } else {
                  openConnectModal();
                }
              }}
            >
              <Wallet size={17} />
              {connectedAddress ? shortAddress(connectedAddress) : t.common.connect}
            </button>
          </div>
        </div>
      </header>

      <main>
        <div key={activePage} className="page-view">
          {activePage === 'home' && (
            <HomePage
              network={network}
              language={language}
              copy={t}
              totalVotes={totalVotes}
              onOpenVote={openVote}
              onOpenTokenomics={() => setActivePage('tokenomics')}
            />
          )}

          {activePage === 'tokenomics' && <TokenomicsPage copy={t} />}

          {activePage === 'roadmap' && <RoadmapPage copy={t} onOpenVote={openVote} />}

          {activePage === 'vote' && (
            <VotePage
              copy={t}
              governanceMode={governanceMode}
              onModeChange={setGovernanceMode}
              selectedProposalId={selectedProposalId}
              onSelectProposal={(proposalId) => {
                setSelectedProposalId(proposalId);
                setVoteForm((current) => ({ ...current, proposalId: String(proposalId) }));
              }}
              selectedProposal={selectedProposal}
              voteForm={voteForm}
              proposalForm={proposalForm}
              connectedAddress={connectedAddress}
              walletBinding={effectiveWalletBinding}
              walletBindingMessage={effectiveWalletBindingMessage}
              transactionPreview={transactionPreview}
              statusMessage={statusMessage}
              errorMessage={errorMessage}
              onConnectWallet={openConnectModal}
              onVoteChange={updateVoteForm}
              onProposalChange={(patch) => setProposalForm((current) => ({ ...current, ...patch }))}
              onBuildVote={buildVotePreview}
              onSendVote={sendVote}
              onBuildProposal={buildProposalPreview}
              onSendProposal={sendProposal}
            />
          )}

          {activePage === 'contracts' && <ContractsPage copy={t} network={network} />}
        </div>
      </main>
    </div>
  );
}

function HomePage({
  network,
  language,
  copy,
  totalVotes,
  onOpenVote,
  onOpenTokenomics,
}: {
  network: NetworkKey;
  language: LanguageKey;
  copy: AppCopy;
  totalVotes: number;
  onOpenVote: () => void;
  onOpenTokenomics: () => void;
}) {
  const addressBook = addressBooks[network];
  const metricIcons = [<ShieldCheck />, <Vote />, <Gauge />, <Activity />];

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>{copy.hero.title}</h1>
          <p>{copy.hero.text}</p>
          <div className="hero-actions">
            <button className="primary-action" type="button" onClick={onOpenVote}>
              {copy.hero.vote}
              <ArrowRight size={18} />
            </button>
            <button className="secondary-action" type="button" onClick={onOpenTokenomics}>
              {copy.hero.tokenomics}
            </button>
          </div>
        </div>

        <div className="hero-mark" aria-hidden="true">
          <div className="mark-glow" />
          <img src="/logo-transparent.png" alt="" />
          <span className="orbit orbit-a" />
          <span className="orbit orbit-b" />
        </div>
      </section>

      <section className="metric-strip" aria-label="Protocol metrics">
        {copy.hero.metrics.map(([label, value, detail], index) => (
          <MetricCard
            key={label}
            icon={metricIcons[index]}
            label={label}
            value={value || formatVotes(totalVotes, language === 'ru' ? 'ru-RU' : 'en-US')}
            detail={detail}
          />
        ))}
      </section>

      <section className="landing-grid">
        <section className="feature-panel dark-panel">
          <h2>{copy.hero.featureTitle}</h2>
          <p>{copy.hero.featureText}</p>
        </section>
        <section className="feature-panel network-panel">
          <div className="panel-heading">
            <span>{copy.hero.network}</span>
            <strong>{addressBook.label}</strong>
          </div>
          <AddressLine label={copy.hero.governor} value={addressBook.addresses.governor} explorerBaseUrl={addressBook.explorerBaseUrl} />
          <AddressLine label={copy.hero.jettonMaster} value={addressBook.addresses.jettonMaster} explorerBaseUrl={addressBook.explorerBaseUrl} />
          <AddressLine label={copy.hero.treasury} value={addressBook.addresses.treasury} explorerBaseUrl={addressBook.explorerBaseUrl} />
        </section>
      </section>
    </>
  );
}

function TokenomicsPage({ copy }: { copy: AppCopy }) {
  return (
    <section className="page-section tokenomics-section">
      <div className="section-copy">
        <h1>{copy.tokenomics.title}</h1>
        <p>{copy.tokenomics.text}</p>
      </div>
      <div className="tokenomics-layout">
        <div className="allocation-card">
          <div className="allocation-total">
            <span>{copy.tokenomics.supplyLabel}</span>
            <strong>{copy.tokenomics.supplyValue}</strong>
          </div>
          <div className="allocation-bars">
            {copy.tokenomics.allocations.map((item) => (
              <div key={item.label} className="allocation-row">
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.detail}</span>
                </div>
                <b>{item.value}%</b>
                <i style={{ width: `${item.value}%` }} />
              </div>
            ))}
          </div>
        </div>
        <div className="token-principles">
          <Principle icon={<Flame />} title={copy.tokenomics.principles[0][0]} text={copy.tokenomics.principles[0][1]} />
          <Principle icon={<Gauge />} title={copy.tokenomics.principles[1][0]} text={copy.tokenomics.principles[1][1]} />
          <Principle icon={<Landmark />} title={copy.tokenomics.principles[2][0]} text={copy.tokenomics.principles[2][1]} />
        </div>
      </div>
    </section>
  );
}

function RoadmapPage({ copy, onOpenVote }: { copy: AppCopy; onOpenVote: () => void }) {
  return (
    <section className="page-section roadmap-section">
      <div className="section-copy">
        <h1>{copy.roadmap.title}</h1>
        <p>{copy.roadmap.text}</p>
      </div>
      <div className="timeline">
        {copy.roadmap.phases.map((item) => (
          <article key={item.phase} className="timeline-item">
            <span>{item.phase}</span>
            <div>
              <div className="timeline-title">
                <h2>{item.title}</h2>
                <b>{item.status}</b>
              </div>
              <p>{item.detail}</p>
            </div>
          </article>
        ))}
      </div>
      <button className="primary-action roadmap-action" type="button" onClick={onOpenVote}>
        {copy.roadmap.openVote}
        <ArrowRight size={18} />
      </button>
    </section>
  );
}

function VotePage({
  copy,
  governanceMode,
  onModeChange,
  selectedProposalId,
  onSelectProposal,
  selectedProposal,
  voteForm,
  proposalForm,
  connectedAddress,
  walletBinding,
  walletBindingMessage,
  transactionPreview,
  statusMessage,
  errorMessage,
  onConnectWallet,
  onVoteChange,
  onProposalChange,
  onBuildVote,
  onSendVote,
  onBuildProposal,
  onSendProposal,
}: {
  copy: AppCopy;
  governanceMode: GovernanceMode;
  onModeChange: (mode: GovernanceMode) => void;
  selectedProposalId: number;
  onSelectProposal: (proposalId: number) => void;
  selectedProposal: ProposalRow;
  voteForm: VoteFormState;
  proposalForm: ProposalFormState;
  connectedAddress: string;
  walletBinding: WalletBindingState;
  walletBindingMessage: string;
  transactionPreview: TonConnectTransaction | null;
  statusMessage: string;
  errorMessage: string;
  onConnectWallet: () => void;
  onVoteChange: (patch: Partial<VoteFormState>) => void;
  onProposalChange: (patch: Partial<ProposalFormState>) => void;
  onBuildVote: () => void;
  onSendVote: () => void;
  onBuildProposal: () => void;
  onSendProposal: () => void;
}) {
  return (
    <section className="page-section vote-section">
      <div className="vote-heading">
        <div>
          <h1>{copy.vote.title}</h1>
          <p>{copy.vote.text}</p>
        </div>
        <div className="mode-switch" aria-label="Governance mode">
          <button
            className={governanceMode === 'cast' ? 'is-active' : ''}
            type="button"
            onClick={() => onModeChange('cast')}
          >
            {copy.vote.cast}
          </button>
          <button
            className={governanceMode === 'propose' ? 'is-active' : ''}
            type="button"
            onClick={() => onModeChange('propose')}
          >
            {copy.vote.propose}
          </button>
        </div>
      </div>

      <div className="governance-grid">
        <ProposalTable copy={copy} selectedProposalId={selectedProposalId} onSelect={onSelectProposal} />
        <div className="governance-workspace">
          {governanceMode === 'cast' ? (
            <VotePanel
              copy={copy}
              form={voteForm}
              proposal={selectedProposal}
              connectedAddress={connectedAddress}
              walletBinding={walletBinding}
              walletBindingMessage={walletBindingMessage}
              onConnectWallet={onConnectWallet}
              onChange={onVoteChange}
              onBuild={onBuildVote}
              onSend={onSendVote}
            />
          ) : (
            <ProposalBuilder
              copy={copy}
              form={proposalForm}
              onChange={onProposalChange}
              onBuild={onBuildProposal}
              onSend={onSendProposal}
            />
          )}
          <TransactionPreview copy={copy} transaction={transactionPreview} status={statusMessage} error={errorMessage} />
        </div>
      </div>
    </section>
  );
}

function ContractsPage({ copy, network }: { copy: AppCopy; network: NetworkKey }) {
  return (
    <section className="page-section contract-section">
      <div className="section-copy">
        <h1>{copy.contracts.title}</h1>
        <p>{copy.contracts.text}</p>
      </div>
      <div className="social-links">
        {socialLinks.map((link) => (
          <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
            {link.label}
          </a>
        ))}
      </div>
      <div className="contract-grid">
        {contractOrder.map((key) => (
          <ContractCard key={key} copy={copy} contractKey={key} network={network} />
        ))}
      </div>
    </section>
  );
}

function MetricCard({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) {
  return (
    <article className="metric-card">
      <span className="metric-icon">{icon}</span>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function Principle({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <article className="principle">
      <span>{icon}</span>
      <strong>{title}</strong>
      <p>{text}</p>
    </article>
  );
}

function ProposalTable({
  copy,
  selectedProposalId,
  onSelect,
}: {
  copy: AppCopy;
  selectedProposalId: number;
  onSelect: (proposalId: number) => void;
}) {
  return (
    <section className="panel proposal-panel">
      <div className="section-header">
        <h2>{copy.vote.votesTitle}</h2>
        <span className="quiet-count">
          {proposalRows.length} {copy.vote.routes}
        </span>
      </div>
      <div className="proposal-list">
        {proposalRows.map((proposal) => {
          const proposalCopy = copy.proposals[proposal.id as keyof typeof copy.proposals];
          return (
            <button
              key={proposal.id}
              className={selectedProposalId === proposal.id ? 'proposal-row is-selected' : 'proposal-row'}
              type="button"
              onClick={() => onSelect(proposal.id)}
            >
              <span className="proposal-main">
                <strong>{proposalCopy?.title ?? proposal.title}</strong>
                <small>{proposal.route}</small>
              </span>
              <span className={`status status-${proposal.status}`}>{copy.status[proposal.status]}</span>
              <VoteBars proposal={proposal} />
              <span className="proposal-meta">
                <Clock3 size={15} />
                {proposalCopy?.endsIn ?? proposal.endsIn}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function VoteBars({ proposal }: { proposal: ProposalRow }) {
  const total = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
  const forWidth = `${(proposal.forVotes / total) * 100}%`;
  const againstWidth = `${(proposal.againstVotes / total) * 100}%`;

  return (
    <span className="vote-bars" aria-label="Vote distribution">
      <span className="for" style={{ width: forWidth }} />
      <span className="against" style={{ width: againstWidth }} />
      <span className="abstain" />
    </span>
  );
}

function VotePanel({
  copy,
  form,
  proposal,
  connectedAddress,
  walletBinding,
  walletBindingMessage,
  onConnectWallet,
  onChange,
  onBuild,
  onSend,
}: {
  copy: AppCopy;
  form: VoteFormState;
  proposal: ProposalRow;
  connectedAddress: string;
  walletBinding: WalletBindingState;
  walletBindingMessage: string;
  onConnectWallet: () => void;
  onChange: (patch: Partial<VoteFormState>) => void;
  onBuild: () => void;
  onSend: () => void;
}) {
  const proposalCopy = copy.proposals[proposal.id as keyof typeof copy.proposals];
  const bindingText = walletBindingText(copy, walletBinding, walletBindingMessage);

  return (
    <section className="panel form-panel">
      <div className="section-header">
        <h2>{copy.vote.castTitle}</h2>
        <span className="status status-open">{copy.vote.jettonTransfer}</span>
      </div>
      <div className="vote-flow" aria-label="Vote flow">
        {copy.vote.flow.map((step, index) => (
          <span
            key={step}
            className={
              (index === 0 && connectedAddress) ||
              (index === 1 && walletBinding === 'ready') ||
              (index === 2 && connectedAddress && Number(form.jettonAmount) > 0)
                ? 'is-done'
                : ''
            }
          >
            {index + 1}. {step}
          </span>
        ))}
      </div>
      <div className="selected-proposal">
        <strong>
          #{proposal.id} {proposalCopy?.title ?? proposal.title}
        </strong>
        <small>{proposalCopy?.execution ?? proposal.execution}</small>
      </div>
      <label>
        {copy.vote.voterJettonWallet}
        <input
          value={form.voterJettonWallet}
          onChange={(event) => onChange({ voterJettonWallet: event.target.value })}
          placeholder={copy.vote.walletPlaceholder}
          spellCheck={false}
        />
      </label>
      <div className={`wallet-strip wallet-strip-${walletBinding}`}>
        <Wallet size={17} />
        <span>{bindingText}</span>
      </div>
      <div className="field-row">
        <label>
          {copy.vote.proposalId}
          <input value={form.proposalId} onChange={(event) => onChange({ proposalId: event.target.value })} />
        </label>
        <label>
          {copy.vote.amount}
          <input value={form.jettonAmount} onChange={(event) => onChange({ jettonAmount: event.target.value })} />
        </label>
      </div>
      <div className="side-selector" aria-label="Vote side">
        {([1, 2, 3] as const).map((side) => (
          <button
            key={side}
            className={form.side === side ? 'is-active' : ''}
            type="button"
            onClick={() => onChange({ side })}
          >
            {copy.sides[side]}
          </button>
        ))}
      </div>
      <div className="field-row">
        <label>
          {copy.vote.gasTon}
          <input value={form.gasTon} onChange={(event) => onChange({ gasTon: event.target.value })} />
        </label>
        <label>
          {copy.vote.forwardTon}
          <input value={form.forwardTon} onChange={(event) => onChange({ forwardTon: event.target.value })} />
        </label>
      </div>
      <div className="owner-strip">
        <Wallet size={17} />
        <span>{connectedAddress ? shortAddress(connectedAddress) : copy.common.walletNotConnected}</span>
        {!connectedAddress && (
          <button type="button" onClick={onConnectWallet}>
            {copy.common.connect}
          </button>
        )}
      </div>
      <div className="button-row">
        <button className="secondary-action" type="button" onClick={onBuild} disabled={!connectedAddress || !form.voterJettonWallet}>
          <Settings2 size={18} />
          {copy.common.buildPayload}
        </button>
        <button className="primary-action" type="button" onClick={onSend} disabled={!connectedAddress}>
          <Send size={18} />
          {copy.common.send}
        </button>
      </div>
    </section>
  );
}

function ProposalBuilder({
  copy,
  form,
  onChange,
  onBuild,
  onSend,
}: {
  copy: AppCopy;
  form: ProposalFormState;
  onChange: (patch: Partial<ProposalFormState>) => void;
  onBuild: () => void;
  onSend: () => void;
}) {
  return (
    <section className="panel form-panel">
      <div className="section-header">
        <h2>{copy.vote.createTitle}</h2>
        <span className="status status-queued">{copy.vote.globalRoute}</span>
      </div>
      <div className="field-row">
        <label>
          {copy.vote.queryId}
          <input value={form.queryId} onChange={(event) => onChange({ queryId: event.target.value })} />
        </label>
        <label>
          {copy.vote.votingEnds}
          <input value={form.votingEndsAt} onChange={(event) => onChange({ votingEndsAt: event.target.value })} />
        </label>
      </div>
      <div className="fee-grid">
        <label>
          {copy.vote.buyFee}
          <input value={form.buyFeePercent} onChange={(event) => onChange({ buyFeePercent: event.target.value })} />
        </label>
        <label>
          {copy.vote.sellFee}
          <input value={form.sellFeePercent} onChange={(event) => onChange({ sellFeePercent: event.target.value })} />
        </label>
        <label>
          {copy.vote.gasTon}
          <input value={form.gasTon} onChange={(event) => onChange({ gasTon: event.target.value })} />
        </label>
      </div>
      <div className="button-row">
        <button className="secondary-action" type="button" onClick={onBuild}>
          <Settings2 size={18} />
          {copy.common.buildPayload}
        </button>
        <button className="primary-action" type="button" onClick={onSend}>
          <Plus size={18} />
          {copy.common.create}
        </button>
      </div>
    </section>
  );
}

function TransactionPreview({
  copy,
  transaction,
  status,
  error,
}: {
  copy: AppCopy;
  transaction: TonConnectTransaction | null;
  status: string;
  error: string;
}) {
  return (
    <section className="panel preview-panel">
      <div className="section-header">
        <h2>{copy.vote.transaction}</h2>
        {status && <span className="status status-executed">{status}</span>}
      </div>
      {error && <div className="feedback-error">{error}</div>}
      <pre>{transaction ? JSON.stringify(transaction, null, 2) : copy.vote.noTransaction}</pre>
    </section>
  );
}

function ContractCard({ copy, contractKey, network }: { copy: AppCopy; contractKey: ContractKey; network: NetworkKey }) {
  const addressBook = addressBooks[network];
  const address = addressBook.addresses[contractKey];

  return (
    <article className="contract-card">
      <div className="contract-title">
        <strong>{contractLabels[contractKey]}</strong>
        <span>{address ? copy.common.ready : copy.common.pending}</span>
      </div>
      <p>{contractRoles[contractKey]}</p>
      <AddressLine label={copy.common.address} value={address} explorerBaseUrl={addressBook.explorerBaseUrl} />
    </article>
  );
}

function AddressLine({
  label,
  value,
  explorerBaseUrl,
}: {
  label: string;
  value: string | null;
  explorerBaseUrl: string;
}) {
  const copy = async () => {
    if (value) {
      await navigator.clipboard.writeText(value);
    }
  };

  return (
    <div className="address-line">
      <span>{label}</span>
      <code>{shortAddress(value)}</code>
      <div className="address-actions">
        <button type="button" onClick={copy} disabled={!value} aria-label={`Copy ${label}`}>
          <Copy size={15} />
        </button>
        <a
          className={!value ? 'is-disabled' : ''}
          href={value ? `${explorerBaseUrl}/${value}` : undefined}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${label}`}
        >
          <ExternalLink size={15} />
        </a>
      </div>
    </div>
  );
}

function requireAddress(address: string | null, message: string): string {
  if (!address) {
    throw new Error(message);
  }
  return address;
}

function walletBindingText(copy: AppCopy, state: WalletBindingState, details: string): string {
  if (state === 'loading') {
    return copy.vote.bindingLoading;
  }
  if (state === 'ready') {
    return copy.vote.bindingReady;
  }
  if (state === 'manual') {
    return copy.vote.bindingManual;
  }
  if (state === 'error') {
    return details || copy.vote.bindingIdle;
  }
  return copy.vote.bindingIdle;
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected error';
}
