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
  Vote,
  Wallet,
} from 'lucide-react';
import { proposalRows, type ProposalRow, type ProposalStatus } from './data/proposals';
import {
  addressBooks,
  contractLabels,
  socialLinks,
  type ContractKey,
  type NetworkKey,
} from './ton/contracts';
import {
  buildGlobalFeeProposalTransaction,
  buildVoteTransaction,
  buildWalletFeeProposalTransaction,
  createQueryId,
  formatVotes,
  resolveJettonWalletInfo,
  shortAddress,
  unixMinutesFromNow,
  type TonConnectTransaction,
  type VoteSide,
} from './ton/transactions';

type PageKey = 'home' | 'tokenomics' | 'roadmap' | 'vote' | 'contracts';
type GovernanceMode = 'cast' | 'propose';
type LanguageKey = 'en' | 'ru';
type WalletBindingState = 'idle' | 'loading' | 'ready' | 'manual' | 'error';
type ProposalKind = 'global' | 'wallet';

interface VoteFormState {
  voterJettonWallet: string;
  proposalId: string;
  side: VoteSide;
  jettonAmount: string;
  gasTon: string;
  forwardTon: string;
}

interface ProposalFormState {
  kind: ProposalKind;
  targetWallet: string;
  buyFeePercent: string;
  sellFeePercent: string;
  votingDurationMinutes: string;
}

const navItemIds: PageKey[] = ['home', 'tokenomics', 'roadmap', 'vote', 'contracts'];
const ACTIVE_NETWORK: NetworkKey = addressBooks.mainnet.addresses.governor ? 'mainnet' : 'testnet';
const DEFAULT_VOTE_GAS_TON = '0.3';
const DEFAULT_VOTE_FORWARD_TON = '0.05';
const PROPOSAL_CREATE_TON = '0.05';
const VOTING_DURATION_PRESETS = [
  { value: '10', label: { en: '10 min', ru: '10 мин' } },
  { value: '30', label: { en: '30 min', ru: '30 мин' } },
  { value: '60', label: { en: '60 min', ru: '60 мин' } },
  { value: '1440', label: { en: '1 day', ru: '1 день' } },
] as const;

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
      contracts: 'Addresses',
    },
    common: {
      connect: 'Connect',
      language: 'Language',
      ready: 'Ready',
      pending: 'Pending',
      address: 'Address',
      walletNotConnected: 'Wallet not connected',
      send: 'Send vote',
      create: 'Create question',
    },
    hero: {
      title: 'Telegram BTC Cat',
      text: 'A community token on TON built around the tgBTC narrative. Holders use tokens to vote on fees, wallet rules, the treasury, and community events.',
      vote: 'Start voting',
      tokenomics: 'Tokenomics',
      metrics: [
        ['Votes', '', 'community weight'],
        ['Fees', '0-100%', 'holder controlled'],
        ['Wallets', 'Targeted', 'wallet rules'],
        ['Events', 'Seasons', 'community campaigns'],
      ],
      featureTitle: 'The community decides the rules.',
      featureText:
        'Holders choose buy and sell fees, propose rules for specific wallets, and launch community events without waiting for a hidden admin.',
      decisionTitle: 'What holders can decide',
      decisions: [
        ['Buy and sell fees', 'from 0% to 100%'],
        ['Wallet rules', 'set by public vote'],
        ['Treasury actions', 'only through public decisions'],
      ],
    },
    tokenomics: {
      title: 'Tokenomics built around voting.',
      text: 'To vote, a holder sends the chosen amount of tgBTCat. The tokens are not returned, so each vote has a real cost and weight.',
      supplyLabel: 'Allocation',
      supplyValue: 'for launch',
      allocations: [
        { label: 'Liquidity', value: 45, detail: 'trading depth and market support' },
        { label: 'Treasury', value: 25, detail: 'development and community decisions' },
        { label: 'Events', value: 15, detail: 'contests, campaigns, and seasons' },
        { label: 'Reserve', value: 10, detail: 'partnerships and unexpected costs' },
        { label: 'Launch', value: 5, detail: 'site, setup, and public rollout' },
      ],
      principles: [
        ['Votes are final', 'Tokens sent for a vote are not returned.'],
        ['Fees are public', 'Buy, sell, and wallet rules are decided by holders.'],
        ['Treasury is visible', 'Spending decisions are made through proposals and can be checked on-chain.'],
      ],
    },
    roadmap: {
      title: 'Roadmap',
      text: 'The path from launch to a governed token economy: token, voting, wallet rules, treasury, and recurring community seasons.',
      openVote: 'Open voting',
      phases: [
        {
          phase: '01',
          title: 'Foundation',
          status: 'In progress',
          detail: 'Finalize token identity, public metadata, source code, contract addresses, and the voting interface.',
        },
        {
          phase: '02',
          title: 'Public voting',
          status: 'Next',
          detail: 'Open token-weighted votes where holders spend tgBTCat to support or reject fee changes.',
        },
        {
          phase: '03',
          title: 'Token launch',
          status: 'Queued',
          detail: 'Publish final metadata, seed liquidity, connect socials, and route new holders into the vote page.',
        },
        {
          phase: '04',
          title: 'Wallet rules',
          status: 'Planned',
          detail: 'Let holders propose wallet-specific buy and sell fees through paid public questions.',
        },
        {
          phase: '05',
          title: 'Community seasons',
          status: 'Planned',
          detail: 'Run recurring events, contests, raids, leaderboard votes, and treasury-backed community campaigns.',
        },
        {
          phase: '06',
          title: 'Treasury expansion',
          status: 'Planned',
          detail: 'Move treasury actions, rewards, and operational spending into public on-chain decisions.',
        },
      ],
    },
    vote: {
      title: 'Voting',
      text: 'Pick a question, choose how many tgBTCat you give to your vote, and sign it in your wallet.',
      cast: 'Vote',
      propose: 'Create question',
      votesTitle: 'Questions',
      routes: 'questions',
      castTitle: 'Your vote',
      jettonTransfer: 'Tokens are not returned',
      selectedProposal: 'Selected question',
      voterJettonWallet: 'Token wallet',
      walletPlaceholder: 'Auto-filled after Ton Connect',
      amount: 'tgBTCat to give to this vote',
      flow: ['Connect wallet', 'We find your token balance', 'Enter vote amount', 'Sign the transaction in wallet'],
      bindingIdle: 'Connect wallet and token balance will be found automatically.',
      bindingLoading: 'Finding your token balance...',
      bindingReady: 'Token balance found:',
      bindingManual: 'Manual token balance route is used.',
      createTitle: 'Create a fee question',
      globalRoute: 'For all buys and sells',
      walletRoute: 'For one wallet',
      proposalKindGlobal: 'All buys and sells',
      proposalKindWallet: 'One wallet',
      targetWallet: 'Wallet address',
      targetWalletPlaceholder: 'Paste TON wallet address',
      votingDuration: 'Voting duration in minutes',
      proposalFee: 'Question fee: {amount} TON',
      buyFee: 'Buy fee %',
      sellFee: 'Sell fee %',
      votePrepared: 'Vote is ready for wallet signature',
      voteSent: 'Open your wallet and confirm the vote',
      proposalPrepared: 'Question is ready for wallet signature',
      proposalSent: 'Open your wallet and confirm the question',
      connectRequired: 'Connect wallet before voting',
      governorRequired: 'Voting is not available right now',
    },
    contracts: {
      title: 'Project addresses',
      text: 'Public addresses for users who want to verify the project in a TON explorer.',
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
    } satisfies Record<VoteSide, string>,
    proposals: {
      0: {
        title: 'Fees for all buys and sells',
        summary: 'General rule for the token',
        endsIn: '17h 42m',
        execution: 'Fee decision',
      },
      1: {
        title: 'Fee for one wallet',
        summary: 'Wallet-specific rule',
        endsIn: 'closed',
        execution: 'Wallet rule',
      },
      2: {
        title: 'Open Satoshi Council event',
        summary: 'Community event',
        endsIn: 'closed',
        execution: 'Community event',
      },
      3: {
        title: 'Top up liquidity treasury',
        summary: 'Treasury decision',
        endsIn: 'executed',
        execution: 'Treasury',
      },
    },
  },
  ru: {
    nav: {
      home: 'Главная',
      tokenomics: 'Токеномика',
      roadmap: 'Роадмапа',
      vote: 'Голосование',
      contracts: 'Адреса',
    },
    common: {
      connect: 'Подключить',
      language: 'Язык',
      ready: 'Готово',
      pending: 'Скоро',
      address: 'Адрес',
      walletNotConnected: 'Кошелек не подключен',
      send: 'Отправить голос',
      create: 'Создать вопрос',
    },
    hero: {
      title: 'Telegram BTC Cat',
      text: 'Токен сообщества на TON под нарратив tgBTC. Держатели голосуют токенами за комиссии, правила для кошельков, решения по казне и события для сообщества.',
      vote: 'Начать голосование',
      tokenomics: 'Токеномика',
      metrics: [
        ['Голоса', '', 'вес сообщества'],
        ['Комиссии', '0-100%', 'решают держатели'],
        ['Кошельки', 'Точечно', 'правила кошельков'],
        ['События', 'Сезоны', 'кампании сообщества'],
      ],
      featureTitle: 'Правила решает сообщество.',
      featureText:
        'Держатели выбирают комиссии покупки и продажи, могут предложить правило для конкретного кошелька и запускать события для сообщества без скрытого админа.',
      decisionTitle: 'Что могут решать держатели',
      decisions: [
        ['Комиссии покупки и продажи', 'от 0% до 100%'],
        ['Правила для кошельков', 'через публичное голосование'],
        ['Действия с казной', 'только через публичные решения'],
      ],
    },
    tokenomics: {
      title: 'Токеномика вокруг голосования.',
      text: 'Чтобы проголосовать, держатель отправляет выбранное количество tgBTCat. Токены не возвращаются, поэтому каждый голос имеет реальную цену и вес.',
      supplyLabel: 'Распределение',
      supplyValue: 'под запуск',
      allocations: [
        { label: 'Ликвидность', value: 45, detail: 'для торгов и поддержки рынка' },
        { label: 'Казна', value: 25, detail: 'на развитие и решения сообщества' },
        { label: 'События', value: 15, detail: 'конкурсы, кампании и сезоны' },
        { label: 'Резерв', value: 10, detail: 'партнерства и непредвиденные расходы' },
        { label: 'Запуск', value: 5, detail: 'сайт, подготовка и публичный старт' },
      ],
      principles: [
        ['Голос не возвращается', 'Токены, отправленные за голос, остаются в системе.'],
        ['Комиссии публичные', 'Покупка, продажа и правила кошельков решаются держателями.'],
        ['Казна прозрачная', 'Решения по расходам проходят через предложения и видны в блокчейне.'],
      ],
    },
    roadmap: {
      title: 'Роадмапа',
      text: 'Путь от запуска к управляемой токен-экономике: токен, голосование, правила кошельков, казна и регулярные сезоны сообщества.',
      openVote: 'Открыть голосование',
      phases: [
        {
          phase: '01',
          title: 'Фундамент',
          status: 'Идет',
          detail: 'Финализируем образ токена, публичные метаданные, исходный код, адреса контрактов и интерфейс голосования.',
        },
        {
          phase: '02',
          title: 'Публичное голосование',
          status: 'Далее',
          detail: 'Открываем голосования, где держатели тратят tgBTCat, чтобы поддержать или отклонить изменение комиссий.',
        },
        {
          phase: '03',
          title: 'Запуск токена',
          status: 'В очереди',
          detail: 'Публикуем финальные метаданные, запускаем ликвидность, подключаем соцсети и ведем держателей на страницу голосования.',
        },
        {
          phase: '04',
          title: 'Правила кошельков',
          status: 'План',
          detail: 'Даем держателям возможность создавать платные публичные вопросы по комиссиям для конкретных кошельков.',
        },
        {
          phase: '05',
          title: 'Сезоны сообщества',
          status: 'План',
          detail: 'Проводим события, конкурсы, рейды, голосования рейтингов и кампании сообщества с поддержкой из казны.',
        },
        {
          phase: '06',
          title: 'Расширение казны',
          status: 'План',
          detail: 'Переводим расходы, награды и операционные решения в публичные ончейн-голосования.',
        },
      ],
    },
    vote: {
      title: 'Голосование',
      text: 'Выбери вопрос, укажи сколько tgBTCat отдаешь за свой голос и подпиши его в кошельке.',
      cast: 'Голосовать',
      propose: 'Создать вопрос',
      votesTitle: 'Вопросы',
      routes: 'вопроса',
      castTitle: 'Ваш голос',
      jettonTransfer: 'Токены не возвращаются',
      selectedProposal: 'Выбранный вопрос',
      voterJettonWallet: 'Кошелек токена',
      walletPlaceholder: 'Заполнится автоматически',
      amount: 'Сколько tgBTCat отдать за голос',
      flow: ['Подключите кошелек', 'Мы сами найдем баланс токенов', 'Введите количество tgBTCat', 'Подпишите транзакцию в кошельке'],
      bindingIdle: 'Подключите кошелек, и баланс токенов найдется автоматически.',
      bindingLoading: 'Ищу баланс токенов...',
      bindingReady: 'Баланс токенов:',
      bindingManual: 'Используется ручной маршрут баланса токенов.',
      createTitle: 'Создать вопрос про комиссии',
      globalRoute: 'Для всех покупок и продаж',
      walletRoute: 'Для одного кошелька',
      proposalKindGlobal: 'Все покупки и продажи',
      proposalKindWallet: 'Один кошелек',
      targetWallet: 'Адрес кошелька',
      targetWalletPlaceholder: 'Вставьте TON-адрес кошелька',
      votingDuration: 'Сколько минут идет голосование',
      proposalFee: 'Плата за вопрос: {amount} TON',
      buyFee: 'Комиссия покупки, %',
      sellFee: 'Комиссия продажи, %',
      votePrepared: 'Голос готов к подписи в кошельке',
      voteSent: 'Откройте кошелек и подтвердите голос',
      proposalPrepared: 'Вопрос готов к подписи в кошельке',
      proposalSent: 'Откройте кошелек и подтвердите вопрос',
      connectRequired: 'Сначала подключите кошелек',
      governorRequired: 'Голосование сейчас недоступно',
    },
    contracts: {
      title: 'Адреса проекта',
      text: 'Публичные адреса для тех, кто хочет проверить проект в обозревателе TON.',
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
    } satisfies Record<VoteSide, string>,
    proposals: {
      0: {
        title: 'Комиссии для всех покупок и продаж',
        summary: 'Общее правило для токена',
        endsIn: '17ч 42м',
        execution: 'Решение по комиссиям',
      },
      1: {
        title: 'Комиссия для одного кошелька',
        summary: 'Правило для конкретного кошелька',
        endsIn: 'закрыто',
        execution: 'Правило кошелька',
      },
      2: {
        title: 'Открыть событие Satoshi Council',
        summary: 'Событие для сообщества',
        endsIn: 'закрыто',
        execution: 'Событие сообщества',
      },
      3: {
        title: 'Пополнить казну ликвидности',
        summary: 'Решение по казне',
        endsIn: 'исполнено',
        execution: 'Казна',
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
  const network = ACTIVE_NETWORK;
  const [activePage, setActivePage] = useState<PageKey>('home');
  const [language, setLanguage] = useState<LanguageKey>(() => detectLanguage());
  const [isScrolled, setIsScrolled] = useState(false);
  const [governanceMode, setGovernanceMode] = useState<GovernanceMode>('cast');
  const [selectedProposalId, setSelectedProposalId] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [walletBinding, setWalletBinding] = useState<WalletBindingState>('idle');
  const [walletBindingMessage, setWalletBindingMessage] = useState('');
  const [tokenBalance, setTokenBalance] = useState('');
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
    gasTon: DEFAULT_VOTE_GAS_TON,
    forwardTon: DEFAULT_VOTE_FORWARD_TON,
  });

  const [proposalForm, setProposalForm] = useState<ProposalFormState>({
    kind: 'global',
    targetWallet: '',
    buyFeePercent: '1',
    sellFeePercent: '2',
    votingDurationMinutes: '60',
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
      setTokenBalance('');
      try {
        const walletInfo = await resolveJettonWalletInfo({
          network,
          jettonMaster,
          ownerAddress: connectedAddress,
        });
        if (cancelled) {
          return;
        }
        setVoteForm((current) => ({ ...current, voterJettonWallet: walletInfo.address }));
        setTokenBalance(walletInfo.formattedBalance);
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

  const sendVote = async () => {
    clearFeedback();
    try {
      const governorAddress = requireAddress(addressBook.addresses.governor, t.vote.governorRequired);
      const responseAddress = requireAddress(connectedAddress, t.vote.connectRequired);
      const transaction = buildVoteTransaction({
        ...voteForm,
        governorAddress,
        responseAddress,
      });
      await sendPreparedTransaction(transaction, t.vote.voteSent);
    } catch (error) {
      setErrorMessage(formatError(error));
    }
  };

  const sendProposal = async () => {
    clearFeedback();
    try {
      requireAddress(connectedAddress, t.vote.connectRequired);
      const governorAddress = requireAddress(addressBook.addresses.governor, t.vote.governorRequired);
      const votingEndsAt = unixMinutesFromNow(parseDurationMinutes(proposalForm.votingDurationMinutes));
      const baseInput = {
        governorAddress,
        queryId: createQueryId(),
        buyFeePercent: proposalForm.buyFeePercent,
        sellFeePercent: proposalForm.sellFeePercent,
        votingEndsAt,
        gasTon: PROPOSAL_CREATE_TON,
      };
      const transaction =
        proposalForm.kind === 'wallet'
          ? buildWalletFeeProposalTransaction({
              ...baseInput,
              targetWallet: proposalForm.targetWallet,
            })
          : buildGlobalFeeProposalTransaction(baseInput);
      await sendPreparedTransaction(transaction, t.vote.proposalSent);
    } catch (error) {
      setErrorMessage(formatError(error));
    }
  };

  const updateVoteForm = (patch: Partial<VoteFormState>) => {
    if (patch.voterJettonWallet !== undefined) {
      setWalletBinding('manual');
      setWalletBindingMessage('');
    }
    setVoteForm((current) => ({ ...current, ...patch }));
  };

  const sendPreparedTransaction = async (transaction: TonConnectTransaction, success: string) => {
    try {
      await tonConnectUI.sendTransaction(transaction);
      setStatusMessage(success);
    } catch (error) {
      setErrorMessage(formatError(error));
    }
  };

  const clearFeedback = () => {
    setErrorMessage('');
    setStatusMessage('');
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
            <button
              className="wallet-button"
              type="button"
              onClick={() => {
                if (connectedAddress) {
                  setWalletBinding('idle');
                  setWalletBindingMessage('');
                  setTokenBalance('');
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
              language={language}
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
              tokenBalance={tokenBalance}
              statusMessage={statusMessage}
              errorMessage={errorMessage}
              onConnectWallet={openConnectModal}
              onVoteChange={updateVoteForm}
              onProposalChange={(patch) => setProposalForm((current) => ({ ...current, ...patch }))}
              onSendVote={sendVote}
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
  language,
  copy,
  totalVotes,
  onOpenVote,
  onOpenTokenomics,
}: {
  language: LanguageKey;
  copy: AppCopy;
  totalVotes: number;
  onOpenVote: () => void;
  onOpenTokenomics: () => void;
}) {
  const metricIcons = [<Vote />, <Gauge />, <Wallet />, <Activity />];

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
          <span className="orbit orbit-c" />
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
            <span>{copy.hero.decisionTitle}</span>
            <strong>tgBTCat</strong>
          </div>
          <div className="decision-list">
            {copy.hero.decisions.map(([title, detail]) => (
              <div key={title} className="decision-line">
                <strong>{title}</strong>
                <span>{detail}</span>
              </div>
            ))}
          </div>
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
  language,
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
  tokenBalance,
  statusMessage,
  errorMessage,
  onConnectWallet,
  onVoteChange,
  onProposalChange,
  onSendVote,
  onSendProposal,
}: {
  language: LanguageKey;
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
  tokenBalance: string;
  statusMessage: string;
  errorMessage: string;
  onConnectWallet: () => void;
  onVoteChange: (patch: Partial<VoteFormState>) => void;
  onProposalChange: (patch: Partial<ProposalFormState>) => void;
  onSendVote: () => void;
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
              tokenBalance={tokenBalance}
              onConnectWallet={onConnectWallet}
              onChange={onVoteChange}
              onSend={onSendVote}
            />
          ) : (
            <ProposalBuilder
              language={language}
              copy={copy}
              form={proposalForm}
              connectedAddress={connectedAddress}
              onConnectWallet={onConnectWallet}
              onChange={onProposalChange}
              onSend={onSendProposal}
            />
          )}
          <FeedbackPanel status={statusMessage} error={errorMessage} />
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
                <small>{proposalCopy?.summary ?? proposal.route}</small>
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
  const total = proposal.forVotes + proposal.againstVotes || 1;
  const forWidth = `${(proposal.forVotes / total) * 100}%`;
  const againstWidth = `${(proposal.againstVotes / total) * 100}%`;

  return (
    <span className="vote-bars" aria-label="Vote distribution">
      <span className="for" style={{ width: forWidth }} />
      <span className="against" style={{ width: againstWidth }} />
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
  tokenBalance,
  onConnectWallet,
  onChange,
  onSend,
}: {
  copy: AppCopy;
  form: VoteFormState;
  proposal: ProposalRow;
  connectedAddress: string;
  walletBinding: WalletBindingState;
  walletBindingMessage: string;
  tokenBalance: string;
  onConnectWallet: () => void;
  onChange: (patch: Partial<VoteFormState>) => void;
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
      {connectedAddress ? (
        <div className={`wallet-strip wallet-strip-${walletBinding}`}>
          <Wallet size={17} />
          <span>
            {walletBinding === 'ready' && tokenBalance
              ? `${bindingText} ${tokenBalance} tgBTCat`
              : bindingText}
          </span>
        </div>
      ) : (
        <button className="connect-wallet-panel" type="button" onClick={onConnectWallet}>
          <Wallet size={18} />
          {copy.common.connect}
        </button>
      )}
      <label>
        {copy.vote.amount}
        <input value={form.jettonAmount} onChange={(event) => onChange({ jettonAmount: event.target.value })} />
      </label>
      <div className="side-selector" aria-label="Vote side">
        {([1, 2] as const).map((side) => (
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
      {connectedAddress && (
        <div className="owner-strip">
          <Wallet size={17} />
          <span>{shortAddress(connectedAddress)}</span>
        </div>
      )}
      <div className="button-row">
        <button className="primary-action wide-action" type="button" onClick={onSend} disabled={!connectedAddress || !form.voterJettonWallet}>
          <Send size={18} />
          {copy.common.send}
        </button>
      </div>
    </section>
  );
}

function ProposalBuilder({
  language,
  copy,
  form,
  connectedAddress,
  onConnectWallet,
  onChange,
  onSend,
}: {
  language: LanguageKey;
  copy: AppCopy;
  form: ProposalFormState;
  connectedAddress: string;
  onConnectWallet: () => void;
  onChange: (patch: Partial<ProposalFormState>) => void;
  onSend: () => void;
}) {
  return (
    <section className="panel form-panel">
      <div className="section-header">
        <h2>{copy.vote.createTitle}</h2>
        <span className="status status-queued">{form.kind === 'wallet' ? copy.vote.walletRoute : copy.vote.globalRoute}</span>
      </div>
      <div className="proposal-kind-switch" aria-label={copy.vote.createTitle}>
        {(['global', 'wallet'] as const).map((kind) => (
          <button
            key={kind}
            className={form.kind === kind ? 'is-active' : ''}
            type="button"
            onClick={() => onChange({ kind })}
          >
            {kind === 'global' ? copy.vote.proposalKindGlobal : copy.vote.proposalKindWallet}
          </button>
        ))}
      </div>
      {form.kind === 'wallet' && (
        <label>
          {copy.vote.targetWallet}
          <input
            value={form.targetWallet}
            onChange={(event) => onChange({ targetWallet: event.target.value })}
            placeholder={copy.vote.targetWalletPlaceholder}
            spellCheck={false}
          />
        </label>
      )}
      <div className="field-row">
        <label>
          {copy.vote.votingDuration}
          <input
            type="text"
            pattern="[0-9]*"
            inputMode="numeric"
            value={form.votingDurationMinutes}
            onChange={(event) => onChange({ votingDurationMinutes: event.target.value })}
          />
        </label>
        <div className="duration-presets">
          {VOTING_DURATION_PRESETS.map((option) => (
            <button
              key={option.value}
              className={form.votingDurationMinutes === option.value ? 'is-active' : ''}
              type="button"
              onClick={() => onChange({ votingDurationMinutes: option.value })}
            >
              {option.label[language]}
            </button>
          ))}
        </div>
      </div>
      <div className="proposal-fee-note">
        <Wallet size={17} />
        <span>{copy.vote.proposalFee.replace('{amount}', PROPOSAL_CREATE_TON)}</span>
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
      </div>
      {!connectedAddress && (
        <button className="connect-wallet-panel" type="button" onClick={onConnectWallet}>
          <Wallet size={18} />
          {copy.common.connect}
        </button>
      )}
      <div className="button-row">
        <button
          className="primary-action wide-action"
          type="button"
          onClick={onSend}
          disabled={!connectedAddress || (form.kind === 'wallet' && !form.targetWallet)}
        >
          <Plus size={18} />
          {copy.common.create}
        </button>
      </div>
    </section>
  );
}

function FeedbackPanel({ status, error }: { status: string; error: string }) {
  if (!status && !error) {
    return null;
  }

  return (
    <section className="feedback-panel">
      {status && <div className="feedback-success">{status}</div>}
      {error && <div className="feedback-error">{error}</div>}
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

function parseDurationMinutes(value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('Voting duration is invalid');
  }
  return parsed;
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected error';
}
