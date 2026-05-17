import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { CHAIN, useTonAddress, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  Flame,
  Gauge,
  Landmark,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trophy,
  Vote,
  Wallet,
} from 'lucide-react';
import type { ProposalRow, ProposalStatus } from './data/proposals';
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
  isValidTonAddress,
  resolveJettonWalletInfo,
  shortAddress,
  signedBocHashHex,
  unixMinutesFromNow,
  type TonConnectTransaction,
  type VoteSide,
} from './ton/transactions';
import {
  fetchGlobalFees,
  fetchGovernanceProposals,
  fetchProposalVoteReceipts,
  fetchWalletFeeRule,
  type GlobalFeeState,
  type VoteReceipt,
  type WalletFeeRuleState,
} from './ton/governance';

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
}

interface CurrentFeesState {
  globalFees: GlobalFeeState | null;
  globalFeesLoading: boolean;
  globalFeesError: string;
  walletFeeTarget: string;
  walletFee: WalletFeeRuleState | null;
  walletFeeLoading: boolean;
  walletFeeError: string;
}

const navItemIds: PageKey[] = ['home', 'tokenomics', 'roadmap', 'vote', 'contracts'];
const ACTIVE_NETWORK: NetworkKey = 'mainnet';
const DEFAULT_VOTE_GAS_TON = '0.7';
const DEFAULT_VOTE_FORWARD_TON = '0.1';
const PROPOSAL_CREATE_JETTONS = '1000';
const FIXED_VOTING_DURATION_MINUTES = 30;

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
      connected: 'Connected',
      pending: 'Pending',
      address: 'Address',
      walletNotConnected: 'Wallet not connected',
      send: 'Send vote',
      create: 'Create question',
      max: 'MAX',
      openExplorer: 'Open in explorer',
    },
    hero: {
      title: 'Telegram BTC Cat',
      text: 'A community token on TON built around the tgBTC narrative. Holders use tokens to vote on fees, specific wallet fees, the treasury, and community events.',
      vote: 'Start voting',
      tokenomics: 'Tokenomics',
      create: 'Create question',
      metrics: [
        ['Vote with tokens', 'for / against', 'send tgBTCat to add weight'],
        ['Create questions', 'tgBTCat fee', 'pay tokens so spam is expensive'],
        ['Change fees', '0-100%', 'buy and sell fees are public'],
        ['Wallet fees', 'specific wallet', 'apply fees to a specific wallet address'],
      ],
      featureTitle: 'The community decides the rules.',
      featureText:
        'Holders choose buy and sell fees, propose fees for specific wallets, and launch community events without waiting for a hidden admin.',
      decisionTitle: 'What holders can decide',
      decisions: [
        ['Buy and sell fees', 'from 0% to 100%'],
        ['Specific wallet fees', 'set by public vote'],
        ['Treasury actions', 'only through public decisions'],
      ],
      rulesTitle: 'Simple rules',
      rules: [
        ['Spend tokens to vote', 'More tgBTCat sent means more weight in the result.'],
        ['for or against', 'two clear choices and no hidden middle state.'],
        ['Small question fee', '1,000 tgBTCat to create a public question and reduce spam.'],
      ],
      eventsTitle: 'Clear event ideas',
      eventsText: 'Events should be easy to understand: votes, contests, rankings, rewards, and public wallet decisions.',
      events: [
        ['Active voter ranking', 'Weekly ranking of holders who spent the most tgBTCat on voting.'],
        ['Temporary fee vote', 'A short vote where holders choose buy and sell fees for the token.'],
        ['Specific wallet fee', 'A public vote to add or remove fees for a specific address.'],
        ['Meme contest', 'A simple meme contest with rewards and a final community vote.'],
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
        { label: 'Events', value: 15, detail: 'contests, rewards, and voting' },
        { label: 'Reserve', value: 10, detail: 'partnerships and unexpected costs' },
        { label: 'Launch', value: 5, detail: 'site, setup, and public rollout' },
      ],
      principles: [
        ['Votes are final', 'Tokens sent for a vote are not returned.'],
        ['Fees are public', 'Buy, sell, and specific wallet fees are decided by holders.'],
        ['Treasury is visible', 'Spending decisions are made through proposals and can be checked on-chain.'],
      ],
    },
    roadmap: {
      title: 'Roadmap',
      text: 'The path from launch to a governed token economy: token, voting, specific wallet fees, treasury, and recurring community activity.',
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
          status: 'Preparing',
          detail: 'Publish final metadata, seed liquidity, connect socials, and route new holders into the vote page.',
        },
        {
          phase: '04',
          title: 'Specific wallet fees',
          status: 'Planned',
          detail: 'Let holders propose wallet-specific buy and sell fees through paid public questions.',
        },
        {
          phase: '05',
          title: 'Community seasons',
          status: 'Planned',
          detail: 'Run recurring votes, contests, rankings, rewards, and treasury-backed community activity.',
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
      emptyCount: '0 questions',
      loadingQuestions: 'Loading on-chain questions...',
      questionsLoadError: 'Could not load on-chain questions. Try again in a minute.',
      refreshQuestions: 'Refresh',
      refreshingQuestions: 'Refreshing...',
      currentFeesTitle: 'current fees',
      currentFeesText: 'these values are read from the live contracts before you vote or create a question.',
      currentFeesLive: 'live on-chain',
      globalBuyFee: 'global buy fee',
      globalSellFee: 'global sell fee',
      globalFeesShort: 'global fees',
      walletFeesShort: 'wallet fee',
      feesLoading: 'loading...',
      feesUnavailable: 'temporarily unavailable',
      walletFeeTitle: 'specific wallet fee',
      walletFeeText: 'paste a wallet to see whether dao has a separate fee rule for it.',
      walletFeePlaceholder: 'paste ton wallet address',
      walletFeeCheck: 'check wallet',
      walletFeeConnected: 'check my wallet',
      walletFeeInvalid: 'paste a valid ton wallet address.',
      walletFeeNoRule: 'no separate rule. the wallet uses the general fee.',
      walletFeeRuleFound: 'separate rule found',
      walletFeeBuy: 'wallet buy fee',
      walletFeeSell: 'wallet sell fee',
      emptyQuestionsTitle: 'No questions yet',
      emptyQuestionsText: 'Create the first question: general buy and sell fees, or fees for a specific wallet.',
      createFirstQuestion: 'Create first question',
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
      bindingAddressReady: 'Token wallet found. Balance will refresh automatically.',
      bindingManual: 'Manual token balance route is used.',
      rulesTitle: 'How voting works',
      rules: [
        ['1 tgBTCat = 1 vote', 'Your weight equals the token amount you send.'],
        ['Tokens are final', 'Sent tokens are not returned after voting.'],
        ['Only two choices', 'Each question has FOR and AGAINST.'],
        ['Questions are paid', 'Creating a public question costs tgBTCat tokens.'],
      ],
      balanceTitle: 'Your tgBTCat balance',
      balanceEmpty: 'Connect wallet to see available tokens.',
      balanceUnavailable: 'Token wallet found. Balance is temporarily unavailable.',
      amountInvalid: 'Enter a positive tgBTCat amount.',
      amountTooHigh: 'This is higher than the token balance found for this wallet.',
      impactTitle: 'Vote preview',
      currentWeight: 'Current result',
      afterVote: 'After your vote',
      outcomeFor: 'If FOR wins, the decision becomes ready to apply.',
      outcomeAgainst: 'If AGAINST wins, fees do not change.',
      resultTitle: 'Question result',
      resultAccepted: 'Accepted. Waiting to be applied.',
      resultApplied: 'Decision applied.',
      resultRejected: 'Not accepted. Fees did not change.',
      resultClosed: 'Voting is closed.',
      voteHistoryTitle: 'who voted',
      voteHistoryLoading: 'loading votes...',
      voteHistoryEmpty: 'No indexed votes for this question yet.',
      voteHistoryError: 'Could not load vote details.',
      voteHistoryCount: 'votes',
      voteHistoryWallet: 'wallet',
      voteHistoryAmount: 'amount',
      proposedFees: 'Proposed fees',
      buyProposed: 'Buy',
      sellProposed: 'Sell',
      createTitle: 'Create a fee question',
      globalRoute: 'For all buys and sells',
      walletRoute: 'For a specific wallet',
      proposalKindGlobal: 'All buys and sells',
      proposalKindWallet: 'Specific wallet',
      scenarioGlobal: 'Change the general buy and sell fees for everyone.',
      scenarioWallet: 'Set buy and sell fees for a specific wallet address.',
      targetWallet: 'Wallet address',
      targetWalletPlaceholder: 'Paste TON wallet address',
      targetWalletInvalid: 'Paste a valid TON wallet address.',
      fixedDuration: 'voting lasts exactly 30 minutes',
      proposalFee: 'Question fee: {amount} tgBTCat',
      proposalFeeDetail: 'This token payment is not returned. It makes spam expensive.',
      proposalFeeTooHigh: 'You need at least {amount} tgBTCat to create a question.',
      mainnetContractsMissing: 'The token and voting are not live on mainnet yet. After deployment this button will turn on.',
      tokenBalanceRequired: 'Token balance was not found yet. Connect a wallet that holds mainnet tgBTCat.',
      targetWalletRequired: 'Paste the wallet address that should receive the fee rule.',
      feeInvalid: 'Fees must be from 0% to 100%.',
      buyFee: 'Buy fee %',
      sellFee: 'Sell fee %',
      feePreviewTitle: 'Fee preview',
      feePreviewText: 'For a 1,000 tgBTCat trade: buy fee {buy} tgBTCat, sell fee {sell} tgBTCat.',
      votePrepared: 'Vote is ready for wallet signature',
      voteSent: 'Vote was sent from the wallet. It should appear on-chain shortly.',
      proposalPrepared: 'Question is ready for wallet signature',
      proposalSent: 'Question was sent from the wallet. It should appear on-chain shortly.',
      connectRequired: 'Connect wallet before voting',
      governorRequired: 'Voting is not available right now',
    },
    contracts: {
      title: 'Project addresses',
      text: 'Public addresses for users who want to verify the project in a TON explorer.',
    },
    status: {
      open: 'Voting',
      passed: 'Ready',
      queued: 'Ready',
      executed: 'Applied',
      rejected: 'Rejected',
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
        title: 'Fee for a specific wallet',
        summary: 'Wallet-specific rule',
        endsIn: 'closed',
        execution: 'Wallet rule',
      },
      2: {
        title: 'Community reward vote',
        summary: 'Community event',
        endsIn: 'closed',
        execution: 'Community event',
      },
      3: {
        title: 'Treasury reward vote',
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
      connected: 'Подключен',
      pending: 'Скоро',
      address: 'Адрес',
      walletNotConnected: 'Кошелек не подключен',
      send: 'Отправить голос',
      create: 'Создать вопрос',
      max: 'макс',
      openExplorer: 'Открыть в обозревателе',
    },
    hero: {
      title: 'telegram btc cat',
      text: 'токен сообщества на TON под нарратив tgBTC. держатели голосуют токенами за комиссии, комиссии для конкретных кошельков, решения по казне и события для сообщества.',
      vote: 'Начать голосование',
      tokenomics: 'Токеномика',
      create: 'Создать вопрос',
      metrics: [
        ['голосовать токенами', 'за / против', 'отправляешь tgbtcat и добавляешь вес'],
        ['создавать вопросы', 'плата tgbtcat', 'платишь токенами, чтобы не было спама'],
        ['менять комиссии', '0-100%', 'покупка и продажа решаются публично'],
        ['комиссии для кошелька', 'конкретный кошелек', 'возможность накладывать комиссии на конкретный кошелек'],
      ],
      featureTitle: 'Правила решает сообщество.',
      featureText:
        'держатели выбирают комиссии покупки и продажи, могут предложить комиссию для конкретного кошелька и запускать события для сообщества без скрытого админа.',
      decisionTitle: 'Что могут решать держатели',
      decisions: [
        ['Комиссии покупки и продажи', 'от 0% до 100%'],
        ['комиссии для конкретных кошельков', 'через публичное голосование'],
        ['Действия с казной', 'только через публичные решения'],
      ],
      rulesTitle: 'Простые правила',
      rules: [
        ['Тратишь токены за голос', 'Чем больше tgBTCat отправишь, тем больше вес голоса.'],
        ['только за или против', 'два понятных варианта без скрытых промежуточных состояний.'],
        ['маленькая плата за вопрос', '1 000 tgbtcat за создание публичного вопроса, чтобы не было спама.'],
      ],
      eventsTitle: 'понятные идеи для событий',
      eventsText: 'события должны быть простыми: голосования, конкурсы, рейтинги, награды и публичные решения по кошелькам.',
      events: [
        ['рейтинг активных голосующих', 'еженедельный рейтинг тех, кто потратил больше всего tgBTCat на голосования.'],
        ['голосование за временные комиссии', 'короткое голосование, где держатели выбирают комиссии покупки и продажи для токена.'],
        ['комиссия для конкретного кошелька', 'публичное голосование, чтобы добавить или убрать комиссию для конкретного адреса.'],
        ['конкурс мемов', 'простой конкурс мемов с наградами и финальным голосованием сообщества.'],
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
        { label: 'События', value: 15, detail: 'конкурсы, награды и голосования' },
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
          status: 'Готовится',
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
          detail: 'проводим голосования, конкурсы, рейтинги, награды и активности сообщества с поддержкой из казны.',
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
      emptyCount: '0 вопросов',
      loadingQuestions: 'загружаю вопросы из блокчейна...',
      questionsLoadError: 'не удалось загрузить вопросы из блокчейна. попробуйте через минуту.',
      refreshQuestions: 'обновить',
      refreshingQuestions: 'обновляю...',
      currentFeesTitle: 'актуальные комиссии',
      currentFeesText: 'эти значения читаются из живых контрактов перед голосованием или созданием вопроса.',
      currentFeesLive: 'онлайн из блокчейна',
      globalBuyFee: 'общая комиссия покупки',
      globalSellFee: 'общая комиссия продажи',
      globalFeesShort: 'общие комиссии',
      walletFeesShort: 'комиссия кошелька',
      feesLoading: 'загружаю...',
      feesUnavailable: 'временно недоступно',
      walletFeeTitle: 'комиссия конкретного кошелька',
      walletFeeText: 'вставьте кошелек, чтобы увидеть, есть ли для него отдельное правило комиссии.',
      walletFeePlaceholder: 'вставьте ton-адрес кошелька',
      walletFeeCheck: 'проверить кошелек',
      walletFeeConnected: 'проверить мой кошелек',
      walletFeeInvalid: 'вставьте корректный ton-адрес кошелька.',
      walletFeeNoRule: 'отдельного правила нет. кошелек использует общую комиссию.',
      walletFeeRuleFound: 'найдено отдельное правило',
      walletFeeBuy: 'комиссия покупки кошелька',
      walletFeeSell: 'комиссия продажи кошелька',
      emptyQuestionsTitle: 'вопросов пока нет',
      emptyQuestionsText: 'создайте первый вопрос: общие комиссии покупки и продажи или комиссия для конкретного кошелька.',
      createFirstQuestion: 'создать первый вопрос',
      castTitle: 'Ваш голос',
      jettonTransfer: 'Токены не возвращаются',
      selectedProposal: 'Выбранный вопрос',
      voterJettonWallet: 'Кошелек токена',
      walletPlaceholder: 'Заполнится автоматически',
      amount: 'Сколько tgBTCat отдать за голос',
      flow: ['подключите кошелек', 'мы сами найдем баланс токенов', 'введите количество tgbtcat', 'подпишите транзакцию в кошельке'],
      bindingIdle: 'Подключите кошелек, и баланс токенов найдется автоматически.',
      bindingLoading: 'Ищу баланс токенов...',
      bindingReady: 'Баланс токенов:',
      bindingAddressReady: 'кошелек токена найден. баланс обновится автоматически.',
      bindingManual: 'Используется ручной маршрут баланса токенов.',
      rulesTitle: 'Как работает голосование',
      rules: [
        ['1 tgBTCat = 1 голос', 'Вес голоса равен количеству токенов, которые вы отправляете.'],
        ['Токены не возвращаются', 'После голосования отправленные токены остаются в системе.'],
        ['только два выбора', 'в каждом вопросе есть за и против.'],
        ['Вопросы платные', 'Создание публичного вопроса стоит 1 000 tgBTCat.'],
      ],
      balanceTitle: 'Ваш баланс tgBTCat',
      balanceEmpty: 'Подключите кошелек, чтобы увидеть доступные токены.',
      balanceUnavailable: 'кошелек токена найден. баланс временно недоступен.',
      amountInvalid: 'Введите положительное количество tgBTCat.',
      amountTooHigh: 'Это больше баланса токенов, найденного у кошелька.',
      impactTitle: 'Предпросмотр голоса',
      currentWeight: 'Текущий результат',
      afterVote: 'После вашего голоса',
      outcomeFor: 'если победит за, решение будет готово к применению.',
      outcomeAgainst: 'если победит против, комиссии не изменятся.',
      resultTitle: 'итог вопроса',
      resultAccepted: 'принято. ждет применения.',
      resultApplied: 'решение применено.',
      resultRejected: 'не принято. комиссии не изменились.',
      resultClosed: 'голосование закрыто.',
      voteHistoryTitle: 'кто голосовал',
      voteHistoryLoading: 'загружаю голоса...',
      voteHistoryEmpty: 'по этому вопросу пока нет голосов в индексе.',
      voteHistoryError: 'не удалось загрузить детали голосов.',
      voteHistoryCount: 'голосов',
      voteHistoryWallet: 'кошелек',
      voteHistoryAmount: 'количество',
      proposedFees: 'предложенные комиссии',
      buyProposed: 'покупка',
      sellProposed: 'продажа',
      createTitle: 'Создать вопрос про комиссии',
      globalRoute: 'Для всех покупок и продаж',
      walletRoute: 'для конкретного кошелька',
      proposalKindGlobal: 'Все покупки и продажи',
      proposalKindWallet: 'конкретный кошелек',
      scenarioGlobal: 'Изменить общие комиссии покупки и продажи для всех.',
      scenarioWallet: 'поставить комиссии покупки и продажи для конкретного кошелька.',
      targetWallet: 'Адрес кошелька',
      targetWalletPlaceholder: 'Вставьте TON-адрес кошелька',
      targetWalletInvalid: 'Вставьте корректный TON-адрес кошелька.',
      fixedDuration: 'голосование длится ровно 30 минут',
      proposalFee: 'плата за вопрос: {amount} tgbtcat',
      proposalFeeDetail: 'эта оплата токенами не возвращается. так спамить вопросами становится дорого.',
      proposalFeeTooHigh: 'нужно минимум {amount} tgbtcat, чтобы создать вопрос.',
      mainnetContractsMissing: 'токен и голосование еще не запущены в mainnet. после деплоя кнопка включится.',
      tokenBalanceRequired: 'баланс токенов пока не найден. подключите кошелек, где есть mainnet tgBTCat.',
      targetWalletRequired: 'вставьте адрес кошелька, для которого создается правило комиссии.',
      feeInvalid: 'комиссии должны быть от 0% до 100%.',
      buyFee: 'Комиссия покупки, %',
      sellFee: 'Комиссия продажи, %',
      feePreviewTitle: 'Предпросмотр комиссии',
      feePreviewText: 'На сделке 1 000 tgBTCat: комиссия покупки {buy} tgBTCat, комиссия продажи {sell} tgBTCat.',
      votePrepared: 'Голос готов к подписи в кошельке',
      voteSent: 'Голос отправлен из кошелька. Скоро он появится ончейн.',
      proposalPrepared: 'Вопрос готов к подписи в кошельке',
      proposalSent: 'Вопрос отправлен из кошелька. Скоро он появится ончейн.',
      connectRequired: 'Сначала подключите кошелек',
      governorRequired: 'Голосование сейчас недоступно',
    },
    contracts: {
      title: 'Адреса проекта',
      text: 'Публичные адреса для тех, кто хочет проверить проект в обозревателе TON.',
    },
    status: {
      open: 'идет голосование',
      passed: 'готово',
      queued: 'готово',
      executed: 'исполнено',
      rejected: 'не принято',
    } satisfies Record<ProposalStatus, string>,
    sides: {
      1: 'за',
      2: 'против',
    } satisfies Record<VoteSide, string>,
    proposals: {
      0: {
        title: 'Комиссии для всех покупок и продаж',
        summary: 'Общее правило для токена',
        endsIn: '17ч 42м',
        execution: 'Решение по комиссиям',
      },
      1: {
        title: 'комиссия для конкретного кошелька',
        summary: 'Правило для конкретного кошелька',
        endsIn: 'закрыто',
        execution: 'Правило кошелька',
      },
      2: {
        title: 'голосование за награды сообщества',
        summary: 'Событие для сообщества',
        endsIn: 'закрыто',
        execution: 'Событие сообщества',
      },
      3: {
        title: 'голосование за расходы казны',
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
  const [selectedProposalId, setSelectedProposalId] = useState(-1);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [lastExplorerHref, setLastExplorerHref] = useState('');
  const [walletBinding, setWalletBinding] = useState<WalletBindingState>('idle');
  const [walletBindingMessage, setWalletBindingMessage] = useState('');
  const [tokenBalance, setTokenBalance] = useState('');
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const [proposalsError, setProposalsError] = useState('');
  const [proposalReloadNonce, setProposalReloadNonce] = useState(0);
  const [voteReceipts, setVoteReceipts] = useState<VoteReceipt[]>([]);
  const [voteReceiptsLoading, setVoteReceiptsLoading] = useState(false);
  const [voteReceiptsError, setVoteReceiptsError] = useState('');
  const selectedProposalIdRef = useRef(selectedProposalId);
  const selectNewestProposalOnRefresh = useRef(false);
  const [globalFees, setGlobalFees] = useState<GlobalFeeState | null>(null);
  const [globalFeesLoading, setGlobalFeesLoading] = useState(false);
  const [globalFeesError, setGlobalFeesError] = useState('');
  const [walletFeeTarget, setWalletFeeTarget] = useState('');
  const [walletFee, setWalletFee] = useState<WalletFeeRuleState | null>(null);
  const [walletFeeLoading, setWalletFeeLoading] = useState(false);
  const [walletFeeError, setWalletFeeError] = useState('');
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const connectedAddress = useTonAddress();

  const t = copyByLanguage[language];
  const addressBook = addressBooks[network];
  const contractsReady = Boolean(addressBook.addresses.governor && addressBook.addresses.jettonMaster);
  const selectedProposal = proposals.find((proposal) => proposal.id === selectedProposalId);
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
  });

  const totalVotes = useMemo(
    () => proposals.reduce((sum, proposal) => sum + proposal.forVotes + proposal.againstVotes + proposal.abstainVotes, 0),
    [proposals],
  );

  useEffect(() => {
    selectedProposalIdRef.current = selectedProposalId;
  }, [selectedProposalId]);

  useEffect(() => {
    tonConnectUI.setConnectionNetwork(CHAIN.MAINNET);
  }, [tonConnectUI]);

  useEffect(() => {
    if (!wallet?.account.chain || wallet.account.chain === CHAIN.MAINNET) {
      return;
    }

    void tonConnectUI.disconnect();
  }, [tonConnectUI, wallet?.account.chain]);

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
    const governorAddress = addressBook.addresses.governor;
    if (!governorAddress) {
      return;
    }

    let cancelled = false;

    const loadProposals = async () => {
      setProposalsLoading(true);
      setProposalsError('');
      try {
        const rows = await fetchGovernanceProposals({
          network,
          governorAddress,
        });
        if (cancelled) {
          return;
        }
        const currentProposalId = selectedProposalIdRef.current;
        const shouldSelectNewest = selectNewestProposalOnRefresh.current;
        const nextProposalId =
          rows.length > 0 && (shouldSelectNewest || !rows.some((proposal) => proposal.id === currentProposalId))
            ? rows[0].id
            : currentProposalId;

        setProposals(rows);
        selectedProposalIdRef.current = nextProposalId;
        setSelectedProposalId(nextProposalId);
        if (nextProposalId >= 0) {
          setVoteForm((current) => ({ ...current, proposalId: String(nextProposalId) }));
        }
        if (shouldSelectNewest && rows.length > 0) {
          setGovernanceMode('cast');
          selectNewestProposalOnRefresh.current = false;
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        setProposals([]);
        setProposalsError(formatError(error));
      } finally {
        if (!cancelled) {
          setProposalsLoading(false);
        }
      }
    };

    void loadProposals();

    return () => {
      cancelled = true;
    };
  }, [addressBook.addresses.governor, network, proposalReloadNonce]);

  useEffect(() => {
    const feeControllerAddress = addressBook.addresses.feeController;
    if (!feeControllerAddress) {
      return;
    }

    let cancelled = false;

    const loadGlobalFees = async () => {
      setGlobalFeesLoading(true);
      setGlobalFeesError('');
      try {
        const result = await fetchGlobalFees(network, feeControllerAddress);
        if (!cancelled) {
          setGlobalFees(result);
        }
      } catch (error) {
        if (!cancelled) {
          setGlobalFees(null);
          setGlobalFeesError(formatError(error));
        }
      } finally {
        if (!cancelled) {
          setGlobalFeesLoading(false);
        }
      }
    };

    void loadGlobalFees();

    return () => {
      cancelled = true;
    };
  }, [addressBook.addresses.feeController, network]);

  useEffect(() => {
    const governorAddress = addressBook.addresses.governor;
    if (!governorAddress || selectedProposalId < 0) {
      return;
    }

    let cancelled = false;

    const loadVoteReceipts = async () => {
      setVoteReceiptsLoading(true);
      setVoteReceiptsError('');
      try {
        const receipts = await fetchProposalVoteReceipts({
          network,
          governorAddress,
          proposalId: selectedProposalId,
        });
        if (!cancelled) {
          setVoteReceipts(receipts);
        }
      } catch (error) {
        if (!cancelled) {
          setVoteReceipts([]);
          setVoteReceiptsError(formatError(error));
        }
      } finally {
        if (!cancelled) {
          setVoteReceiptsLoading(false);
        }
      }
    };

    void loadVoteReceipts();

    return () => {
      cancelled = true;
    };
  }, [addressBook.addresses.governor, network, selectedProposalId, proposalReloadNonce]);

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
      const sent = await sendPreparedTransaction(transaction, t.vote.voteSent);
      if (sent) {
        requestProposalRefresh();
      }
    } catch (error) {
      setErrorMessage(formatError(error));
    }
  };

  const sendProposal = async () => {
    clearFeedback();
    try {
      const responseAddress = requireAddress(connectedAddress, t.vote.connectRequired);
      const voterJettonWallet = requireAddress(voteForm.voterJettonWallet, t.vote.bindingIdle);
      const governorAddress = requireAddress(addressBook.addresses.governor, t.vote.governorRequired);
      const votingEndsAt = unixMinutesFromNow(FIXED_VOTING_DURATION_MINUTES);
      const baseInput = {
        voterJettonWallet,
        governorAddress,
        responseAddress,
        queryId: createQueryId(),
        buyFeePercent: proposalForm.buyFeePercent,
        sellFeePercent: proposalForm.sellFeePercent,
        votingEndsAt,
        proposalJettonAmount: PROPOSAL_CREATE_JETTONS,
        gasTon: DEFAULT_VOTE_GAS_TON,
        forwardTon: DEFAULT_VOTE_FORWARD_TON,
      };
      const transaction =
        proposalForm.kind === 'wallet'
          ? buildWalletFeeProposalTransaction({
              ...baseInput,
              targetWallet: proposalForm.targetWallet,
            })
          : buildGlobalFeeProposalTransaction(baseInput);
      const sent = await sendPreparedTransaction(transaction, t.vote.proposalSent);
      if (sent) {
        window.setTimeout(() => {
          setActivePage('vote');
          setGovernanceMode('cast');
          requestProposalRefresh({ selectNewest: true });
        }, 2500);
      }
    } catch (error) {
      setErrorMessage(formatError(error));
    }
  };

  const lookupWalletFee = async (target = walletFeeTarget) => {
    const walletFeeRegistryAddress = addressBook.addresses.walletFeeRegistry;
    const normalized = target.trim();
    setWalletFeeError('');
    setWalletFee(null);

    if (!walletFeeRegistryAddress) {
      setWalletFeeError(t.vote.governorRequired);
      return;
    }
    if (!isValidTonAddress(normalized)) {
      setWalletFeeError(t.vote.walletFeeInvalid);
      return;
    }

    setWalletFeeLoading(true);
    try {
      const result = await fetchWalletFeeRule(network, walletFeeRegistryAddress, normalized);
      setWalletFee(result);
    } catch (error) {
      setWalletFeeError(formatError(error));
    } finally {
      setWalletFeeLoading(false);
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
      const result = await tonConnectUI.sendTransaction(transaction);
      const signedHash = result.boc ? signedBocHashHex(result.boc) : '';
      if (signedHash) {
        setLastExplorerHref(`${addressBook.explorerBaseUrl}/transaction/${signedHash}`);
      }
      setStatusMessage(success);
      return true;
    } catch (error) {
      setErrorMessage(formatError(error));
      return false;
    }
  };

  const requestProposalRefresh = (options: { selectNewest?: boolean } = {}) => {
    const refresh = () => {
      if (options.selectNewest) {
        selectNewestProposalOnRefresh.current = true;
      }
      setProposalReloadNonce((current) => current + 1);
    };

    refresh();
    [5_000, 12_000, 22_000].forEach((delay) => {
      window.setTimeout(refresh, delay);
    });
  };

  const clearFeedback = () => {
    setErrorMessage('');
    setStatusMessage('');
    setLastExplorerHref('');
  };

  const openConnectModal = () => {
    clearFeedback();
    void tonConnectUI.openModal().catch((error) => {
      setErrorMessage(formatError(error));
    });
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
              <span className={connectedAddress ? 'wallet-address' : undefined}>
                {connectedAddress ? shortAddress(connectedAddress) : t.common.connect}
              </span>
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
              onOpenCreate={() => {
                setActivePage('vote');
                setGovernanceMode('propose');
              }}
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
              proposals={proposals}
              proposalsLoading={proposalsLoading}
              proposalsError={proposalsError}
              currentFees={{
                globalFees,
                globalFeesLoading,
                globalFeesError,
                walletFeeTarget,
                walletFee,
                walletFeeLoading,
                walletFeeError,
              }}
              selectedProposalId={selectedProposalId}
              onSelectProposal={(proposalId) => {
                selectedProposalIdRef.current = proposalId;
                setSelectedProposalId(proposalId);
                setVoteForm((current) => ({ ...current, proposalId: String(proposalId) }));
              }}
              selectedProposal={selectedProposal}
              voteForm={voteForm}
              proposalForm={proposalForm}
              connectedAddress={connectedAddress}
              contractsReady={contractsReady}
              walletBinding={effectiveWalletBinding}
              walletBindingMessage={effectiveWalletBindingMessage}
              tokenBalance={tokenBalance}
              voteReceipts={voteReceipts}
              voteReceiptsLoading={voteReceiptsLoading}
              voteReceiptsError={voteReceiptsError}
              statusMessage={statusMessage}
              errorMessage={errorMessage}
              explorerHref={lastExplorerHref}
              onConnectWallet={openConnectModal}
              onVoteChange={updateVoteForm}
              onProposalChange={(patch) => setProposalForm((current) => ({ ...current, ...patch }))}
              onWalletFeeTargetChange={setWalletFeeTarget}
              onLookupWalletFee={() => void lookupWalletFee()}
              onLookupConnectedWalletFee={
                connectedAddress ? () => void lookupWalletFee(connectedAddress) : undefined
              }
              onRefreshProposals={() => requestProposalRefresh()}
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
  onOpenCreate,
  onOpenTokenomics,
}: {
  language: LanguageKey;
  copy: AppCopy;
  totalVotes: number;
  onOpenVote: () => void;
  onOpenCreate: () => void;
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
            <button className="secondary-action" type="button" onClick={onOpenCreate}>
              {copy.hero.create}
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

      <section className="rule-strip" aria-label={copy.hero.rulesTitle}>
        <div className="section-header compact-header">
          <h2>{copy.hero.rulesTitle}</h2>
          <span>tgBTCat</span>
        </div>
        <div className="rule-grid">
          {copy.hero.rules.map(([title, detail], index) => (
            <article key={title} className="rule-card">
              <span>{index === 0 ? <Vote /> : index === 1 ? <ShieldCheck /> : <Wallet />}</span>
              <strong>{title}</strong>
              <p>{detail}</p>
            </article>
          ))}
        </div>
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

      <section className="event-section">
        <div className="section-copy slim-copy">
          <h2>{copy.hero.eventsTitle}</h2>
          <p>{copy.hero.eventsText}</p>
        </div>
        <div className="event-grid">
          {copy.hero.events.map(([title, detail], index) => (
            <article key={title} className="event-card">
              <span>{index === 0 ? <Trophy /> : index === 1 ? <SlidersHorizontal /> : index === 2 ? <AlertCircle /> : <Sparkles />}</span>
              <strong>{title}</strong>
              <p>{detail}</p>
            </article>
          ))}
        </div>
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
  proposals,
  proposalsLoading,
  proposalsError,
  currentFees,
  selectedProposalId,
  onSelectProposal,
  selectedProposal,
  voteForm,
  proposalForm,
  connectedAddress,
  contractsReady,
  walletBinding,
  walletBindingMessage,
  tokenBalance,
  voteReceipts,
  voteReceiptsLoading,
  voteReceiptsError,
  statusMessage,
  errorMessage,
  explorerHref,
  onConnectWallet,
  onVoteChange,
  onProposalChange,
  onWalletFeeTargetChange,
  onLookupWalletFee,
  onLookupConnectedWalletFee,
  onRefreshProposals,
  onSendVote,
  onSendProposal,
}: {
  language: LanguageKey;
  copy: AppCopy;
  governanceMode: GovernanceMode;
  onModeChange: (mode: GovernanceMode) => void;
  proposals: ProposalRow[];
  proposalsLoading: boolean;
  proposalsError: string;
  currentFees: CurrentFeesState;
  selectedProposalId: number;
  onSelectProposal: (proposalId: number) => void;
  selectedProposal: ProposalRow | undefined;
  voteForm: VoteFormState;
  proposalForm: ProposalFormState;
  connectedAddress: string;
  contractsReady: boolean;
  walletBinding: WalletBindingState;
  walletBindingMessage: string;
  tokenBalance: string;
  voteReceipts: VoteReceipt[];
  voteReceiptsLoading: boolean;
  voteReceiptsError: string;
  statusMessage: string;
  errorMessage: string;
  explorerHref: string;
  onConnectWallet: () => void;
  onVoteChange: (patch: Partial<VoteFormState>) => void;
  onProposalChange: (patch: Partial<ProposalFormState>) => void;
  onWalletFeeTargetChange: (value: string) => void;
  onLookupWalletFee: () => void;
  onLookupConnectedWalletFee?: () => void;
  onRefreshProposals: () => void;
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

      <VoteRulesPanel copy={copy} />
      <CurrentFeesPanel
        copy={copy}
        fees={currentFees}
        connectedAddress={connectedAddress}
        onWalletFeeTargetChange={onWalletFeeTargetChange}
        onLookupWalletFee={onLookupWalletFee}
        onLookupConnectedWalletFee={onLookupConnectedWalletFee}
      />

      <div className="governance-grid">
        <ProposalTable
          language={language}
          copy={copy}
          proposals={proposals}
          loading={proposalsLoading}
          error={proposalsError}
          selectedProposalId={selectedProposalId}
          onSelect={onSelectProposal}
          onRefresh={onRefreshProposals}
        />
        <div className="governance-workspace">
          {governanceMode === 'cast' && selectedProposal ? (
            <VotePanel
              language={language}
              copy={copy}
              form={voteForm}
              proposal={selectedProposal}
              connectedAddress={connectedAddress}
              walletBinding={walletBinding}
              walletBindingMessage={walletBindingMessage}
              tokenBalance={tokenBalance}
              voteReceipts={voteReceipts}
              voteReceiptsLoading={voteReceiptsLoading}
              voteReceiptsError={voteReceiptsError}
              onConnectWallet={onConnectWallet}
              onChange={onVoteChange}
              onSend={onSendVote}
            />
          ) : governanceMode === 'cast' ? (
            <EmptyVotePanel copy={copy} onCreateQuestion={() => onModeChange('propose')} />
          ) : (
            <ProposalBuilder
              copy={copy}
              form={proposalForm}
              connectedAddress={connectedAddress}
              contractsReady={contractsReady}
              voterJettonWallet={voteForm.voterJettonWallet}
              walletBinding={walletBinding}
              tokenBalance={tokenBalance}
              onConnectWallet={onConnectWallet}
              onChange={onProposalChange}
              onSend={onSendProposal}
            />
          )}
          <FeedbackPanel copy={copy} status={statusMessage} error={errorMessage} explorerHref={explorerHref} />
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

function VoteRulesPanel({ copy }: { copy: AppCopy }) {
  const icons = [<Vote />, <Flame />, <CheckCircle2 />, <Wallet />];

  return (
    <section className="vote-rules-panel">
      <div className="section-header compact-header">
        <h2>{copy.vote.rulesTitle}</h2>
        <span>{copy.vote.jettonTransfer}</span>
      </div>
      <div className="rule-grid">
        {copy.vote.rules.map(([title, detail], index) => (
          <article key={title} className="rule-card">
            <span>{icons[index]}</span>
            <strong>{title}</strong>
            <p>{detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function CurrentFeesPanel({
  copy,
  fees,
  connectedAddress,
  onWalletFeeTargetChange,
  onLookupWalletFee,
  onLookupConnectedWalletFee,
}: {
  copy: AppCopy;
  fees: CurrentFeesState;
  connectedAddress: string;
  onWalletFeeTargetChange: (value: string) => void;
  onLookupWalletFee: () => void;
  onLookupConnectedWalletFee?: () => void;
}) {
  const globalBuy = fees.globalFees ? `${formatPercentValue(fees.globalFees.buyFeePercent)}%` : copy.vote.feesUnavailable;
  const globalSell = fees.globalFees ? `${formatPercentValue(fees.globalFees.sellFeePercent)}%` : copy.vote.feesUnavailable;

  return (
    <section className="panel current-fees-panel">
      <div className="section-header">
        <div>
          <h2>{copy.vote.currentFeesTitle}</h2>
          <p>{copy.vote.currentFeesText}</p>
        </div>
        <span className="status status-open">{copy.vote.currentFeesLive}</span>
      </div>

      <div className="current-fee-grid">
        <article className="current-fee-card">
          <span>{copy.vote.globalBuyFee}</span>
          <strong>{fees.globalFeesLoading ? copy.vote.feesLoading : globalBuy}</strong>
        </article>
        <article className="current-fee-card">
          <span>{copy.vote.globalSellFee}</span>
          <strong>{fees.globalFeesLoading ? copy.vote.feesLoading : globalSell}</strong>
        </article>
      </div>
      {fees.globalFeesError && <p className="field-error">{fees.globalFeesError}</p>}

      <details className="wallet-fee-lookup">
        <summary>
          <strong>{copy.vote.walletFeeTitle}</strong>
          <span>{copy.vote.walletFeeText}</span>
        </summary>
        <div className="wallet-fee-lookup-body">
          <label>
            {copy.vote.targetWallet}
            <input
              value={fees.walletFeeTarget}
              placeholder={copy.vote.walletFeePlaceholder}
              onChange={(event) => onWalletFeeTargetChange(event.target.value)}
            />
          </label>
          <div className="button-row">
            <button className="secondary-action" type="button" disabled={fees.walletFeeLoading} onClick={onLookupWalletFee}>
              {fees.walletFeeLoading ? copy.vote.feesLoading : copy.vote.walletFeeCheck}
            </button>
            {connectedAddress && onLookupConnectedWalletFee && (
              <button className="secondary-action" type="button" disabled={fees.walletFeeLoading} onClick={onLookupConnectedWalletFee}>
                {copy.vote.walletFeeConnected}
              </button>
            )}
          </div>
          {fees.walletFeeError && <p className="field-error">{fees.walletFeeError}</p>}
          {fees.walletFee && (
            <div className={fees.walletFee.isSet ? 'wallet-fee-result is-set' : 'wallet-fee-result'}>
              <strong>{fees.walletFee.isSet ? copy.vote.walletFeeRuleFound : copy.vote.walletFeeNoRule}</strong>
              {fees.walletFee.isSet && (
                <div className="current-fee-grid">
                  <article className="current-fee-card">
                    <span>{copy.vote.walletFeeBuy}</span>
                    <strong>{formatPercentValue(fees.walletFee.buyFeePercent)}%</strong>
                  </article>
                  <article className="current-fee-card">
                    <span>{copy.vote.walletFeeSell}</span>
                    <strong>{formatPercentValue(fees.walletFee.sellFeePercent)}%</strong>
                  </article>
                </div>
              )}
            </div>
          )}
        </div>
      </details>
    </section>
  );
}

function ProposalTable({
  language,
  copy,
  proposals,
  loading,
  error,
  selectedProposalId,
  onSelect,
  onRefresh,
}: {
  language: LanguageKey;
  copy: AppCopy;
  proposals: ProposalRow[];
  loading: boolean;
  error: string;
  selectedProposalId: number;
  onSelect: (proposalId: number) => void;
  onRefresh: () => void;
}) {
  return (
    <section className="panel proposal-panel">
      <div className="section-header">
        <h2>{copy.vote.votesTitle}</h2>
        <div className="proposal-header-actions">
          <span className="quiet-count">
            {proposals.length > 0 ? `${proposals.length} ${copy.vote.routes}` : copy.vote.emptyCount}
          </span>
          <button className="compact-action" type="button" disabled={loading} onClick={onRefresh}>
            <RefreshCw size={15} />
            {loading ? copy.vote.refreshingQuestions : copy.vote.refreshQuestions}
          </button>
        </div>
      </div>
      <div className="proposal-list">
        {loading && proposals.length === 0 ? (
          <div className="proposal-empty-state">
            <strong>{copy.vote.loadingQuestions}</strong>
            <p>{copy.vote.text}</p>
          </div>
        ) : error && proposals.length === 0 ? (
          <div className="proposal-empty-state">
            <strong>{copy.vote.questionsLoadError}</strong>
            <p>{error}</p>
          </div>
        ) : proposals.length === 0 ? (
          <div className="proposal-empty-state">
            <strong>{copy.vote.emptyQuestionsTitle}</strong>
            <p>{copy.vote.emptyQuestionsText}</p>
          </div>
        ) : proposals.map((proposal) => {
          const listTitle = proposal.target === 'feeController' ? copy.vote.globalFeesShort : copy.vote.walletFeesShort;
          const timing = formatProposalTiming(proposal, language);
          return (
            <button
              key={proposal.id}
              className={selectedProposalId === proposal.id ? 'proposal-row is-selected' : 'proposal-row'}
              type="button"
              onClick={() => onSelect(proposal.id)}
            >
              <span className="proposal-main">
                <strong>#{proposal.id} {listTitle}</strong>
                <span className="proposal-row-meta">
                  <span className={`status status-${proposal.status}`}>{copy.status[proposal.status]}</span>
                  {timing && (
                    <span className="proposal-meta">
                      <Clock3 size={14} />
                      {timing}
                    </span>
                  )}
                </span>
              </span>
              <ProposedFees copy={copy} proposal={proposal} compact />
              <VoteBars proposal={proposal} />
            </button>
          );
        })}
      </div>
      {error && proposals.length > 0 && <p className="proposal-refresh-error">{copy.vote.questionsLoadError}</p>}
    </section>
  );
}

function EmptyVotePanel({ copy, onCreateQuestion }: { copy: AppCopy; onCreateQuestion: () => void }) {
  return (
    <section className="panel form-panel empty-vote-panel">
      <div className="section-header">
        <h2>{copy.vote.emptyQuestionsTitle}</h2>
        <span className="status status-queued">{copy.vote.emptyCount}</span>
      </div>
      <p>{copy.vote.emptyQuestionsText}</p>
      <button className="primary-action wide-action" type="button" onClick={onCreateQuestion}>
        <Plus size={18} />
        {copy.vote.createFirstQuestion}
      </button>
    </section>
  );
}

function getProposalDisplay(copy: AppCopy, proposal: ProposalRow) {
  if (proposal.target === 'walletFeeRegistry') {
    return {
      title: copy.vote.proposalKindWallet,
      summary: copy.vote.scenarioWallet,
      execution: copy.proposals[1]?.execution ?? proposal.execution,
    };
  }

  if (proposal.target === 'feeController') {
    return {
      title: copy.vote.proposalKindGlobal,
      summary: copy.vote.scenarioGlobal,
      execution: copy.proposals[0]?.execution ?? proposal.execution,
    };
  }

  return {
    title: proposal.title,
    summary: proposal.route,
    execution: proposal.execution,
  };
}

function ProposedFees({
  copy,
  proposal,
  compact = false,
}: {
  copy: AppCopy;
  proposal: ProposalRow;
  compact?: boolean;
}) {
  if (proposal.buyFeePercent === undefined || proposal.sellFeePercent === undefined) {
    return null;
  }

  return (
    <div className={compact ? 'proposed-fees proposed-fees-compact' : 'proposed-fees'}>
      {!compact && <strong>{copy.vote.proposedFees}</strong>}
      <span>{copy.vote.buyProposed}: {proposal.buyFeePercent}%</span>
      <span>{copy.vote.sellProposed}: {proposal.sellFeePercent}%</span>
      {proposal.walletRule && <small className="wallet-address">{proposal.walletRule}</small>}
    </div>
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
  language,
  copy,
  form,
  proposal,
  connectedAddress,
  walletBinding,
  walletBindingMessage,
  tokenBalance,
  voteReceipts,
  voteReceiptsLoading,
  voteReceiptsError,
  onConnectWallet,
  onChange,
  onSend,
}: {
  language: LanguageKey;
  copy: AppCopy;
  form: VoteFormState;
  proposal: ProposalRow;
  connectedAddress: string;
  walletBinding: WalletBindingState;
  walletBindingMessage: string;
  tokenBalance: string;
  voteReceipts: VoteReceipt[];
  voteReceiptsLoading: boolean;
  voteReceiptsError: string;
  onConnectWallet: () => void;
  onChange: (patch: Partial<VoteFormState>) => void;
  onSend: () => void;
}) {
  const proposalDisplay = getProposalDisplay(copy, proposal);
  const bindingText =
    walletBinding === 'ready' && !tokenBalance
      ? copy.vote.bindingAddressReady
      : walletBindingText(copy, walletBinding, walletBindingMessage);
  const amountUnits = parseDecimalUnits(form.jettonAmount, true);
  const balanceUnits = tokenBalance ? parseDecimalUnits(tokenBalance, false) : null;
  const amountInvalid = amountUnits === null;
  const amountTooHigh =
    walletBinding === 'ready' && amountUnits !== null && balanceUnits !== null && amountUnits > balanceUnits;
  const votingClosed = proposal.status !== 'open';
  const voteAmount = amountUnits === null ? 0 : Number(form.jettonAmount);
  const preview = buildVotePreview(proposal, form.side, Number.isFinite(voteAmount) ? voteAmount : 0);
  const locale = language === 'ru' ? 'ru-RU' : 'en-US';
  const canUseMax = walletBinding === 'ready' && balanceUnits !== null && balanceUnits > 0n;

  if (votingClosed) {
    return (
      <section className="panel form-panel result-panel">
        <div className="section-header">
          <h2>{copy.vote.resultTitle}</h2>
          <span className={`status status-${proposal.status}`}>{copy.status[proposal.status]}</span>
        </div>
        <div className="vote-context-card">
          <div className="selected-proposal">
            <strong>
              #{proposal.id} {proposalDisplay.title}
            </strong>
            <small>{proposalDisplay.execution}</small>
          </div>
          <ProposedFees copy={copy} proposal={proposal} compact />
        </div>
        <ProposalResultSummary copy={copy} proposal={proposal} language={language} />
        <VoteHistoryPanel
          copy={copy}
          language={language}
          receipts={voteReceipts}
          loading={voteReceiptsLoading}
          error={voteReceiptsError}
        />
      </section>
    );
  }

  return (
    <section className="panel form-panel">
      <div className="section-header">
        <h2>{copy.vote.castTitle}</h2>
        <span className="status status-open">{copy.vote.jettonTransfer}</span>
      </div>
      {!connectedAddress && (
        <div className="vote-flow" aria-label="Vote flow">
          {copy.vote.flow.map((step, index) => (
            <span key={step}>{index + 1}. {step}</span>
          ))}
        </div>
      )}
      <div className="vote-context-card">
        <div className="selected-proposal">
          <strong>
            #{proposal.id} {proposalDisplay.title}
          </strong>
          <small>{proposalDisplay.execution}</small>
        </div>
        <ProposedFees copy={copy} proposal={proposal} compact />
      </div>
      {connectedAddress ? (
        <div className="balance-card">
          <div className={`wallet-strip wallet-strip-${walletBinding}`}>
            <Wallet size={17} />
            <span>{bindingText}</span>
          </div>
          <strong>
            {walletBinding === 'ready' && tokenBalance
              ? `${tokenBalance} tgBTCat`
              : walletBinding === 'ready'
                ? copy.vote.balanceUnavailable
                : copy.vote.balanceEmpty}
          </strong>
        </div>
      ) : (
        <button className="connect-wallet-panel" type="button" onClick={onConnectWallet}>
          <Wallet size={18} />
          {copy.common.connect}
        </button>
      )}
      <label className="amount-field">
        <span className="label-row">
          {copy.vote.amount}
          <button
            className="mini-action"
            type="button"
            disabled={!canUseMax}
            onClick={() => onChange({ jettonAmount: tokenBalance })}
          >
            {copy.common.max}
          </button>
        </span>
        <input
          inputMode="decimal"
          value={form.jettonAmount}
          onChange={(event) => onChange({ jettonAmount: event.target.value })}
        />
      </label>
      {amountInvalid && <p className="field-error">{copy.vote.amountInvalid}</p>}
      {amountTooHigh && <p className="field-error">{copy.vote.amountTooHigh}</p>}
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

      <div className="impact-panel">
        <div className="impact-heading">
          <span>
            <Gauge size={17} />
            {copy.vote.impactTitle}
          </span>
          <strong>{copy.sides[form.side]}</strong>
        </div>
        <div className="impact-grid">
          <div>
            <span>{copy.vote.currentWeight}</span>
            <strong>{copy.sides[1]} {formatPercent(preview.currentForPercent)} / {copy.sides[2]} {formatPercent(preview.currentAgainstPercent)}</strong>
          </div>
          <div>
            <span>{copy.vote.afterVote}</span>
            <strong>{copy.sides[1]} {formatPercent(preview.nextForPercent)} / {copy.sides[2]} {formatPercent(preview.nextAgainstPercent)}</strong>
          </div>
        </div>
        <div className="impact-totals">
          <span>{copy.sides[1]} {formatVotes(preview.nextForVotes, locale)}</span>
          <span>{copy.sides[2]} {formatVotes(preview.nextAgainstVotes, locale)}</span>
        </div>
        <p>{form.side === 1 ? copy.vote.outcomeFor : copy.vote.outcomeAgainst}</p>
      </div>
      <VoteHistoryPanel
        copy={copy}
        language={language}
        receipts={voteReceipts}
        loading={voteReceiptsLoading}
        error={voteReceiptsError}
      />
      <div className="button-row">
        <button
          className="primary-action wide-action"
          type="button"
          onClick={onSend}
          disabled={!connectedAddress || !form.voterJettonWallet || amountInvalid || amountTooHigh}
        >
          <Send size={18} />
          {copy.common.send}
        </button>
      </div>
    </section>
  );
}

function ProposalResultSummary({
  copy,
  proposal,
  language,
}: {
  copy: AppCopy;
  proposal: ProposalRow;
  language: LanguageKey;
}) {
  const locale = language === 'ru' ? 'ru-RU' : 'en-US';
  const total = proposal.forVotes + proposal.againstVotes || 1;
  const forPercent = (proposal.forVotes / total) * 100;
  const againstPercent = (proposal.againstVotes / total) * 100;
  const resultText =
    proposal.status === 'executed'
      ? copy.vote.resultApplied
      : proposal.status === 'rejected'
        ? copy.vote.resultRejected
        : proposal.status === 'passed' || proposal.status === 'queued'
          ? copy.vote.resultAccepted
          : copy.vote.resultClosed;

  return (
    <div className="impact-panel result-summary">
      <div className="impact-heading">
        <span>
          <Trophy size={17} />
          {copy.vote.resultTitle}
        </span>
        <strong>{copy.status[proposal.status]}</strong>
      </div>
      <div className="impact-grid">
        <div>
          <span>{copy.sides[1]}</span>
          <strong>{formatPercent(forPercent)}</strong>
          <small>{formatVotes(proposal.forVotes, locale)}</small>
        </div>
        <div>
          <span>{copy.sides[2]}</span>
          <strong>{formatPercent(againstPercent)}</strong>
          <small>{formatVotes(proposal.againstVotes, locale)}</small>
        </div>
      </div>
      <VoteBars proposal={proposal} />
      <p>{resultText}</p>
    </div>
  );
}

function VoteHistoryPanel({
  copy,
  language,
  receipts,
  loading,
  error,
}: {
  copy: AppCopy;
  language: LanguageKey;
  receipts: VoteReceipt[];
  loading: boolean;
  error: string;
}) {
  const locale = language === 'ru' ? 'ru-RU' : 'en-US';

  return (
    <details className="vote-history-panel">
      <summary>
        <span>
          <Wallet size={17} />
          {copy.vote.voteHistoryTitle}
        </span>
        <strong>{loading ? copy.vote.voteHistoryLoading : `${receipts.length} ${copy.vote.voteHistoryCount}`}</strong>
      </summary>
      <div className="vote-history-body">
        {error ? (
          <p className="field-error">{copy.vote.voteHistoryError} {error}</p>
        ) : loading ? (
          <p>{copy.vote.voteHistoryLoading}</p>
        ) : receipts.length === 0 ? (
          <p>{copy.vote.voteHistoryEmpty}</p>
        ) : (
          <div className="vote-history-list">
            {receipts.map((receipt) => (
              <div key={`${receipt.txHash}-${receipt.voter}-${receipt.side}-${receipt.amount}`} className="vote-history-row">
                <span className="vote-history-wallet">{shortAddress(receipt.voter)}</span>
                <span className={`vote-history-side vote-history-side-${receipt.side}`}>{copy.sides[receipt.side]}</span>
                <strong>{formatVotes(receipt.amount, locale)} tgBTCat</strong>
                <time>{formatVoteReceiptTime(receipt.timestamp, language)}</time>
              </div>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}

function ProposalBuilder({
  copy,
  form,
  connectedAddress,
  contractsReady,
  voterJettonWallet,
  walletBinding,
  tokenBalance,
  onConnectWallet,
  onChange,
  onSend,
}: {
  copy: AppCopy;
  form: ProposalFormState;
  connectedAddress: string;
  contractsReady: boolean;
  voterJettonWallet: string;
  walletBinding: WalletBindingState;
  tokenBalance: string;
  onConnectWallet: () => void;
  onChange: (patch: Partial<ProposalFormState>) => void;
  onSend: () => void;
}) {
  const proposalFeeUnits = parseDecimalUnits(PROPOSAL_CREATE_JETTONS, true);
  const balanceUnits = tokenBalance ? parseDecimalUnits(tokenBalance, false) : null;
  const proposalFeeTooHigh =
    walletBinding === 'ready' && proposalFeeUnits !== null && balanceUnits !== null && balanceUnits < proposalFeeUnits;
  const targetWalletInvalid =
    form.kind === 'wallet' && form.targetWallet.trim() !== '' && !isValidTonAddress(form.targetWallet);
  const targetWalletMissing = form.kind === 'wallet' && !form.targetWallet.trim();
  const buyFeeInvalid = !isFeePercentValid(form.buyFeePercent);
  const sellFeeInvalid = !isFeePercentValid(form.sellFeePercent);
  const createDisabled =
    !contractsReady ||
    !connectedAddress ||
    !voterJettonWallet ||
    proposalFeeTooHigh ||
    targetWalletMissing ||
    targetWalletInvalid ||
    buyFeeInvalid ||
    sellFeeInvalid;
  const createDisabledReason =
    !contractsReady
      ? copy.vote.mainnetContractsMissing
      : !connectedAddress
        ? copy.vote.connectRequired
        : walletBinding === 'loading'
          ? copy.vote.bindingLoading
          : !voterJettonWallet
            ? copy.vote.tokenBalanceRequired
            : proposalFeeTooHigh
              ? copy.vote.proposalFeeTooHigh.replace('{amount}', PROPOSAL_CREATE_JETTONS)
              : targetWalletMissing
                ? copy.vote.targetWalletRequired
                : targetWalletInvalid
                  ? copy.vote.targetWalletInvalid
                  : buyFeeInvalid || sellFeeInvalid
                    ? copy.vote.feeInvalid
                    : '';
  const buyPreview = feePreviewAmount(form.buyFeePercent);
  const sellPreview = feePreviewAmount(form.sellFeePercent);

  return (
    <section className="panel form-panel">
      <div className="section-header">
        <h2>{copy.vote.createTitle}</h2>
        <span className="status status-queued">{form.kind === 'wallet' ? copy.vote.walletRoute : copy.vote.globalRoute}</span>
      </div>
      <div className="create-scenarios" aria-label={copy.vote.createTitle}>
        {(['global', 'wallet'] as const).map((kind) => (
          <button
            key={kind}
            className={form.kind === kind ? 'is-active' : ''}
            type="button"
            onClick={() => onChange({ kind })}
          >
            <span>{kind === 'global' ? <SlidersHorizontal /> : <Wallet />}</span>
            <strong>{kind === 'global' ? copy.vote.proposalKindGlobal : copy.vote.proposalKindWallet}</strong>
            <small>{kind === 'global' ? copy.vote.scenarioGlobal : copy.vote.scenarioWallet}</small>
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
          {targetWalletInvalid && <span className="field-error">{copy.vote.targetWalletInvalid}</span>}
        </label>
      )}
      <div className="proposal-fee-note">
        <Clock3 size={17} />
        <span>{copy.vote.fixedDuration}</span>
      </div>
      <div className="proposal-fee-note">
        <Wallet size={17} />
        <span>{copy.vote.proposalFee.replace('{amount}', PROPOSAL_CREATE_JETTONS)}</span>
      </div>
      <p className="field-hint">{copy.vote.proposalFeeDetail}</p>
      {proposalFeeTooHigh && (
        <p className="field-error">{copy.vote.proposalFeeTooHigh.replace('{amount}', PROPOSAL_CREATE_JETTONS)}</p>
      )}
      <div className="fee-grid">
        <FeeControl label={copy.vote.buyFee} value={form.buyFeePercent} onChange={(buyFeePercent) => onChange({ buyFeePercent })} />
        <FeeControl label={copy.vote.sellFee} value={form.sellFeePercent} onChange={(sellFeePercent) => onChange({ sellFeePercent })} />
      </div>
      <div className="fee-preview">
        <strong>{copy.vote.feePreviewTitle}</strong>
        <p>{copy.vote.feePreviewText.replace('{buy}', buyPreview).replace('{sell}', sellPreview)}</p>
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
          disabled={createDisabled}
        >
          <Plus size={18} />
          {copy.common.create}
        </button>
      </div>
      {createDisabledReason && <p className="field-error create-disabled-reason">{createDisabledReason}</p>}
    </section>
  );
}

function FeeControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const rangeValue = feeRangeValue(value);
  const isInvalid = !isFeePercentValid(value);

  return (
    <label className="fee-control">
      <span className="fee-control-header">
        {label}
        <strong>{rangeValue}%</strong>
      </span>
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={rangeValue}
        onChange={(event) => onChange(event.target.value)}
      />
      <input
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={isInvalid}
      />
      {isInvalid && <span className="field-error">0-100%</span>}
    </label>
  );
}

function FeedbackPanel({
  copy,
  status,
  error,
  explorerHref,
}: {
  copy: AppCopy;
  status: string;
  error: string;
  explorerHref: string;
}) {
  if (!status && !error) {
    return null;
  }

  return (
    <section className="feedback-panel">
      {status && (
        <div className="feedback-success">
          <span>{status}</span>
          {explorerHref && (
            <a href={explorerHref} target="_blank" rel="noreferrer">
              {copy.common.openExplorer}
              <ExternalLink size={15} />
            </a>
          )}
        </div>
      )}
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

function buildVotePreview(proposal: ProposalRow, side: VoteSide, amount: number) {
  const currentTotal = proposal.forVotes + proposal.againstVotes || 1;
  const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;
  const nextForVotes = proposal.forVotes + (side === 1 ? safeAmount : 0);
  const nextAgainstVotes = proposal.againstVotes + (side === 2 ? safeAmount : 0);
  const nextTotal = nextForVotes + nextAgainstVotes || 1;

  return {
    currentForPercent: (proposal.forVotes / currentTotal) * 100,
    currentAgainstPercent: (proposal.againstVotes / currentTotal) * 100,
    nextForPercent: (nextForVotes / nextTotal) * 100,
    nextAgainstPercent: (nextAgainstVotes / nextTotal) * 100,
    nextForVotes,
    nextAgainstVotes,
  };
}

function parseDecimalUnits(value: string, requirePositive: boolean): bigint | null {
  const normalized = value.trim();
  if (!/^\d+(\.\d{0,9})?$/.test(normalized)) {
    return null;
  }

  const [whole, fraction = ''] = normalized.split('.');
  const units = BigInt(whole + fraction.padEnd(9, '0'));
  if (requirePositive && units <= 0n) {
    return null;
  }
  return units;
}

function isFeePercentValid(value: string): boolean {
  const normalized = value.trim();
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) {
    return false;
  }
  const numeric = Number(normalized);
  return Number.isFinite(numeric) && numeric >= 0 && numeric <= 100;
}

function feeRangeValue(value: string): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(numeric)));
}

function feePreviewAmount(value: string): string {
  return formatPreviewAmount(feePreviewNumeric(value));
}

function feePreviewNumeric(value: string): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return 0;
  }
  return (1000 * Math.min(100, numeric)) / 100;
}

function formatPreviewAmount(value: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

function formatPercentValue(value: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatProposalTiming(proposal: ProposalRow, language: LanguageKey): string {
  if (proposal.status !== 'open' || !proposal.votingEndsAt) {
    return '';
  }

  const seconds = Math.max(0, proposal.votingEndsAt - Math.floor(Date.now() / 1000));
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) {
    return language === 'ru' ? `${minutes} мин` : `${minutes} min`;
  }

  const hours = Math.ceil(minutes / 60);
  return language === 'ru' ? `${hours} ч` : `${hours} h`;
}

function formatVoteReceiptTime(timestamp: number, language: LanguageKey): string {
  if (!timestamp) {
    return language === 'ru' ? 'скоро' : 'soon';
  }

  return new Intl.DateTimeFormat(language === 'ru' ? 'ru-RU' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp * 1000));
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
    return details || copy.vote.bindingReady;
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
