import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
import { proposalRows, statusLabel, voteSideLabels, type ProposalRow } from './data/proposals';
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
  shortAddress,
  unixHoursFromNow,
  type TonConnectTransaction,
  type VoteSide,
} from './ton/transactions';

type PageKey = 'home' | 'tokenomics' | 'roadmap' | 'vote' | 'contracts';
type GovernanceMode = 'cast' | 'propose';

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

const navItems: Array<{ id: PageKey; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'tokenomics', label: 'Tokenomics' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'vote', label: 'Vote' },
  { id: 'contracts', label: 'Contracts' },
];

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

const tokenomics = [
  { label: 'Liquidity', value: 45, detail: 'DEX depth and market operations' },
  { label: 'DAO Treasury', value: 25, detail: 'governance reserve and execution budget' },
  { label: 'Events', value: 15, detail: 'community campaigns and on-chain rituals' },
  { label: 'Strategic Reserve', value: 10, detail: 'partnerships, listings, emergency runway' },
  { label: 'Launch Ops', value: 5, detail: 'deployment, verification, and infrastructure' },
];

const roadmap = [
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
];

export default function App() {
  const [network, setNetwork] = useState<NetworkKey>('testnet');
  const [activePage, setActivePage] = useState<PageKey>('home');
  const [governanceMode, setGovernanceMode] = useState<GovernanceMode>('cast');
  const [selectedProposalId, setSelectedProposalId] = useState(0);
  const [transactionPreview, setTransactionPreview] = useState<TonConnectTransaction | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [tonConnectUI] = useTonConnectUI();
  const { open: openConnectModal } = useTonConnectModal();
  const connectedAddress = useTonAddress();

  const addressBook = addressBooks[network];
  const selectedProposal = proposalRows.find((proposal) => proposal.id === selectedProposalId) ?? proposalRows[0];

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activePage]);

  const openVote = () => {
    setActivePage('vote');
    setGovernanceMode('cast');
  };

  const buildVotePreview = () => {
    clearFeedback();
    try {
      const governorAddress = requireAddress(addressBook.addresses.governor, 'Governor is not deployed');
      const responseAddress = requireAddress(connectedAddress, 'Connect a wallet before building a vote transaction');
      const transaction = buildVoteTransaction({
        ...voteForm,
        governorAddress,
        responseAddress,
      });
      setTransactionPreview(transaction);
      setStatusMessage('Vote transaction prepared');
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
    await sendPreparedTransaction(transaction, 'Vote transaction sent to wallet');
  };

  const buildProposalPreview = () => {
    clearFeedback();
    try {
      const governorAddress = requireAddress(addressBook.addresses.governor, 'Governor is not deployed');
      const transaction = buildGlobalFeeProposalTransaction({
        ...proposalForm,
        governorAddress,
      });
      setTransactionPreview(transaction);
      setStatusMessage('Proposal transaction prepared');
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
    await sendPreparedTransaction(transaction, 'Proposal transaction sent to wallet');
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
      <header className="topbar">
        <button className="brand" type="button" onClick={() => setActivePage('home')}>
          <img src="/logo-transparent.png" alt="" />
          <strong>TG BTC Cat</strong>
        </button>

        <nav className="main-nav" aria-label="Primary">
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
                void tonConnectUI.disconnect();
              } else {
                openConnectModal();
              }
            }}
          >
            <Wallet size={17} />
            {connectedAddress ? shortAddress(connectedAddress) : 'Connect'}
          </button>
        </div>
      </header>

      <main>
        <div key={activePage} className="page-view">
          {activePage === 'home' && (
            <HomePage
              network={network}
              totalVotes={totalVotes}
              onOpenVote={openVote}
              onOpenTokenomics={() => setActivePage('tokenomics')}
            />
          )}

          {activePage === 'tokenomics' && <TokenomicsPage />}

          {activePage === 'roadmap' && <RoadmapPage onOpenVote={openVote} />}

          {activePage === 'vote' && (
            <VotePage
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
              transactionPreview={transactionPreview}
              statusMessage={statusMessage}
              errorMessage={errorMessage}
              onVoteChange={(patch) => setVoteForm((current) => ({ ...current, ...patch }))}
              onProposalChange={(patch) => setProposalForm((current) => ({ ...current, ...patch }))}
              onBuildVote={buildVotePreview}
              onSendVote={sendVote}
              onBuildProposal={buildProposalPreview}
              onSendProposal={sendProposal}
            />
          )}

          {activePage === 'contracts' && <ContractsPage network={network} />}
        </div>
      </main>
    </div>
  );
}

function HomePage({
  network,
  totalVotes,
  onOpenVote,
  onOpenTokenomics,
}: {
  network: NetworkKey;
  totalVotes: number;
  onOpenVote: () => void;
  onOpenTokenomics: () => void;
}) {
  const addressBook = addressBooks[network];

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>Telegram BTC Cat</h1>
          <p>
            A DAO-governed TON jetton for the tgBTC narrative. Holders commit tokens on-chain to move fee policy,
            wallet-specific rules, treasury actions, and community events.
          </p>
          <div className="hero-actions">
            <button className="primary-action" type="button" onClick={onOpenVote}>
              Vote on-chain
              <ArrowRight size={18} />
            </button>
            <button className="secondary-action" type="button" onClick={onOpenTokenomics}>
              Tokenomics
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
        <MetricCard icon={<ShieldCheck />} label="Contracts" value="9" detail="current surface" />
        <MetricCard icon={<Vote />} label="Votes" value={formatVotes(totalVotes)} detail="sample governance" />
        <MetricCard icon={<Gauge />} label="Fees" value="0-100%" detail="DAO-controlled" />
        <MetricCard icon={<Activity />} label="Tests" value="95" detail="Acton gate" />
      </section>

      <section className="landing-grid">
        <section className="feature-panel dark-panel">
          <h2>Fees are policy, not admin settings.</h2>
          <p>
            Buy and sell fees can move from zero to full capture through proposals. Wallet-specific rules let the DAO
            respond to campaigns, bad actors, market events, or community games without replacing the token.
          </p>
        </section>
        <section className="feature-panel network-panel">
          <div className="panel-heading">
            <span>Network</span>
            <strong>{addressBook.label}</strong>
          </div>
          <AddressLine label="Governor" value={addressBook.addresses.governor} explorerBaseUrl={addressBook.explorerBaseUrl} />
          <AddressLine label="Jetton Master" value={addressBook.addresses.jettonMaster} explorerBaseUrl={addressBook.explorerBaseUrl} />
          <AddressLine label="DAO Treasury" value={addressBook.addresses.treasury} explorerBaseUrl={addressBook.explorerBaseUrl} />
        </section>
      </section>
    </>
  );
}

function TokenomicsPage() {
  return (
    <section className="page-section tokenomics-section">
      <div className="section-copy">
        <h1>Tokenomics built for visible governance.</h1>
        <p>
          Every vote is a committed transfer. The more tokens a holder sends into governance, the more weight they place
          behind the decision.
        </p>
      </div>
      <div className="tokenomics-layout">
        <div className="allocation-card">
          <div className="allocation-total">
            <span>Supply model</span>
            <strong>DAO launch</strong>
          </div>
          <div className="allocation-bars">
            {tokenomics.map((item) => (
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
          <Principle icon={<Flame />} title="Irreversible votes" text="Vote weight is paid into governance and does not return." />
          <Principle icon={<Gauge />} title="0-100% fee range" text="Global and wallet-specific fees are controlled by proposals." />
          <Principle icon={<Landmark />} title="Treasury routes" text="DAO execution can move TON, jettons, and event state through contracts." />
        </div>
      </div>
    </section>
  );
}

function RoadmapPage({ onOpenVote }: { onOpenVote: () => void }) {
  return (
    <section className="page-section roadmap-section">
      <div className="section-copy">
        <h1>Roadmap</h1>
        <p>From local protocol gate to public voting surface, then liquidity, launch, and recurring DAO seasons.</p>
      </div>
      <div className="timeline">
        {roadmap.map((item) => (
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
        Open vote page
        <ArrowRight size={18} />
      </button>
    </section>
  );
}

function VotePage({
  governanceMode,
  onModeChange,
  selectedProposalId,
  onSelectProposal,
  selectedProposal,
  voteForm,
  proposalForm,
  connectedAddress,
  transactionPreview,
  statusMessage,
  errorMessage,
  onVoteChange,
  onProposalChange,
  onBuildVote,
  onSendVote,
  onBuildProposal,
  onSendProposal,
}: {
  governanceMode: GovernanceMode;
  onModeChange: (mode: GovernanceMode) => void;
  selectedProposalId: number;
  onSelectProposal: (proposalId: number) => void;
  selectedProposal: ProposalRow;
  voteForm: VoteFormState;
  proposalForm: ProposalFormState;
  connectedAddress: string;
  transactionPreview: TonConnectTransaction | null;
  statusMessage: string;
  errorMessage: string;
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
          <h1>On-chain voting</h1>
          <p>Send tokens, cast weight, and build the exact TON Connect transaction before it reaches the wallet.</p>
        </div>
        <div className="mode-switch" aria-label="Governance mode">
          <button
            className={governanceMode === 'cast' ? 'is-active' : ''}
            type="button"
            onClick={() => onModeChange('cast')}
          >
            Cast
          </button>
          <button
            className={governanceMode === 'propose' ? 'is-active' : ''}
            type="button"
            onClick={() => onModeChange('propose')}
          >
            Propose
          </button>
        </div>
      </div>

      <div className="governance-grid">
        <ProposalTable selectedProposalId={selectedProposalId} onSelect={onSelectProposal} />
        <div className="governance-workspace">
          {governanceMode === 'cast' ? (
            <VotePanel
              form={voteForm}
              proposal={selectedProposal}
              connectedAddress={connectedAddress}
              onChange={onVoteChange}
              onBuild={onBuildVote}
              onSend={onSendVote}
            />
          ) : (
            <ProposalBuilder
              form={proposalForm}
              onChange={onProposalChange}
              onBuild={onBuildProposal}
              onSend={onSendProposal}
            />
          )}
          <TransactionPreview transaction={transactionPreview} status={statusMessage} error={errorMessage} />
        </div>
      </div>
    </section>
  );
}

function ContractsPage({ network }: { network: NetworkKey }) {
  return (
    <section className="page-section contract-section">
      <div className="section-copy">
        <h1>Contract registry</h1>
        <p>Current address book for the DAO surface. Mainnet fields stay closed until the launch deployment is final.</p>
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
          <ContractCard key={key} contractKey={key} network={network} />
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
  selectedProposalId,
  onSelect,
}: {
  selectedProposalId: number;
  onSelect: (proposalId: number) => void;
}) {
  return (
    <section className="panel proposal-panel">
      <div className="section-header">
        <h2>Votes</h2>
        <span className="quiet-count">{proposalRows.length} routes</span>
      </div>
      <div className="proposal-list">
        {proposalRows.map((proposal) => (
          <button
            key={proposal.id}
            className={selectedProposalId === proposal.id ? 'proposal-row is-selected' : 'proposal-row'}
            type="button"
            onClick={() => onSelect(proposal.id)}
          >
            <span className="proposal-main">
              <strong>{proposal.title}</strong>
              <small>{proposal.route}</small>
            </span>
            <span className={`status status-${proposal.status}`}>{statusLabel[proposal.status]}</span>
            <VoteBars proposal={proposal} />
            <span className="proposal-meta">
              <Clock3 size={15} />
              {proposal.endsIn}
            </span>
          </button>
        ))}
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
  form,
  proposal,
  connectedAddress,
  onChange,
  onBuild,
  onSend,
}: {
  form: VoteFormState;
  proposal: ProposalRow;
  connectedAddress: string;
  onChange: (patch: Partial<VoteFormState>) => void;
  onBuild: () => void;
  onSend: () => void;
}) {
  return (
    <section className="panel form-panel">
      <div className="section-header">
        <h2>Cast vote</h2>
        <span className="status status-open">Jetton transfer</span>
      </div>
      <div className="selected-proposal">
        <strong>
          #{proposal.id} {proposal.title}
        </strong>
        <small>{proposal.execution}</small>
      </div>
      <label>
        Voter jetton wallet
        <input
          value={form.voterJettonWallet}
          onChange={(event) => onChange({ voterJettonWallet: event.target.value })}
          placeholder="Your tgBTCat jetton wallet"
          spellCheck={false}
        />
      </label>
      <div className="field-row">
        <label>
          Proposal ID
          <input value={form.proposalId} onChange={(event) => onChange({ proposalId: event.target.value })} />
        </label>
        <label>
          Amount
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
            {voteSideLabels[side === 1 ? 'for' : side === 2 ? 'against' : 'abstain']}
          </button>
        ))}
      </div>
      <div className="field-row">
        <label>
          Gas TON
          <input value={form.gasTon} onChange={(event) => onChange({ gasTon: event.target.value })} />
        </label>
        <label>
          Forward TON
          <input value={form.forwardTon} onChange={(event) => onChange({ forwardTon: event.target.value })} />
        </label>
      </div>
      <div className="wallet-strip">
        <Wallet size={17} />
        <span>{connectedAddress ? shortAddress(connectedAddress) : 'Wallet not connected'}</span>
      </div>
      <div className="button-row">
        <button className="secondary-action" type="button" onClick={onBuild}>
          <Settings2 size={18} />
          Build payload
        </button>
        <button className="primary-action" type="button" onClick={onSend} disabled={!connectedAddress}>
          <Send size={18} />
          Send
        </button>
      </div>
    </section>
  );
}

function ProposalBuilder({
  form,
  onChange,
  onBuild,
  onSend,
}: {
  form: ProposalFormState;
  onChange: (patch: Partial<ProposalFormState>) => void;
  onBuild: () => void;
  onSend: () => void;
}) {
  return (
    <section className="panel form-panel">
      <div className="section-header">
        <h2>Create fee proposal</h2>
        <span className="status status-queued">Global route</span>
      </div>
      <div className="field-row">
        <label>
          Query ID
          <input value={form.queryId} onChange={(event) => onChange({ queryId: event.target.value })} />
        </label>
        <label>
          Voting ends
          <input value={form.votingEndsAt} onChange={(event) => onChange({ votingEndsAt: event.target.value })} />
        </label>
      </div>
      <div className="fee-grid">
        <label>
          Buy fee %
          <input value={form.buyFeePercent} onChange={(event) => onChange({ buyFeePercent: event.target.value })} />
        </label>
        <label>
          Sell fee %
          <input value={form.sellFeePercent} onChange={(event) => onChange({ sellFeePercent: event.target.value })} />
        </label>
        <label>
          Gas TON
          <input value={form.gasTon} onChange={(event) => onChange({ gasTon: event.target.value })} />
        </label>
      </div>
      <div className="button-row">
        <button className="secondary-action" type="button" onClick={onBuild}>
          <Settings2 size={18} />
          Build payload
        </button>
        <button className="primary-action" type="button" onClick={onSend}>
          <Plus size={18} />
          Create
        </button>
      </div>
    </section>
  );
}

function TransactionPreview({
  transaction,
  status,
  error,
}: {
  transaction: TonConnectTransaction | null;
  status: string;
  error: string;
}) {
  return (
    <section className="panel preview-panel">
      <div className="section-header">
        <h2>Transaction</h2>
        {status && <span className="status status-executed">{status}</span>}
      </div>
      {error && <div className="feedback-error">{error}</div>}
      <pre>{transaction ? JSON.stringify(transaction, null, 2) : 'No transaction prepared'}</pre>
    </section>
  );
}

function ContractCard({ contractKey, network }: { contractKey: ContractKey; network: NetworkKey }) {
  const addressBook = addressBooks[network];
  const address = addressBook.addresses[contractKey];

  return (
    <article className="contract-card">
      <div className="contract-title">
        <strong>{contractLabels[contractKey]}</strong>
        <span>{address ? 'Ready' : 'Pending'}</span>
      </div>
      <p>{contractRoles[contractKey]}</p>
      <AddressLine label="Address" value={address} explorerBaseUrl={addressBook.explorerBaseUrl} />
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

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected error';
}
