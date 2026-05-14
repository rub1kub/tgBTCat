import { useMemo, useState, type ReactNode } from 'react';
import { useTonAddress, useTonConnectModal, useTonConnectUI } from '@tonconnect/ui-react';
import {
  Activity,
  CircleDollarSign,
  Clock3,
  Copy,
  ExternalLink,
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

type TabKey = 'overview' | 'vote' | 'propose' | 'contracts';

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

const tabs: Array<{ id: TabKey; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'vote', label: 'Vote' },
  { id: 'propose', label: 'Propose' },
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

export default function App() {
  const [network, setNetwork] = useState<NetworkKey>('testnet');
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
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
    voterJettonWallet: addressBooks.testnet.addresses.governorVoteJettonWallet ?? '',
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
        <a className="brand" href="/">
          <img src="/logo.png" alt="" />
          <span>
            <strong>TG BTC Cat</strong>
            <small>DAO Console</small>
          </span>
        </a>

        <nav className="tabs" aria-label="Primary">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? 'tab is-active' : 'tab'}
              type="button"
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="topbar-actions">
          <div className="segmented" aria-label="Network">
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
            {connectedAddress ? shortAddress(connectedAddress) : 'Connect Wallet'}
          </button>
        </div>
      </header>

      <main>
        <section className="hero-grid">
          <div className="hero-copy">
            <p className="system-label">TON governance infrastructure</p>
            <h1>On-chain fee policy, treasury execution, and community events for tgBTCat.</h1>
            <div className="hero-actions">
              <button className="primary-action" type="button" onClick={() => setActiveTab('vote')}>
                <Vote size={18} />
                Open voting
              </button>
              <button className="secondary-action" type="button" onClick={() => setActiveTab('contracts')}>
                <ExternalLink size={18} />
                View contracts
              </button>
            </div>
          </div>

          <div className="network-panel">
            <div className="panel-heading">
              <span>Active network</span>
              <strong>{addressBook.label}</strong>
            </div>
            <AddressLine
              label="Governor"
              value={addressBook.addresses.governor}
              explorerBaseUrl={addressBook.explorerBaseUrl}
            />
            <AddressLine
              label="Jetton Master"
              value={addressBook.addresses.jettonMaster}
              explorerBaseUrl={addressBook.explorerBaseUrl}
            />
            <AddressLine
              label="DAO Treasury"
              value={addressBook.addresses.treasury}
              explorerBaseUrl={addressBook.explorerBaseUrl}
            />
          </div>
        </section>

        <section className="metrics-grid" aria-label="Protocol metrics">
          <MetricCard icon={<ShieldCheck />} label="Contracts" value="9" detail="current protocol surface" />
          <MetricCard icon={<Vote />} label="Votes indexed" value={formatVotes(totalVotes)} detail="sample governance view" />
          <MetricCard icon={<Gauge />} label="Fee range" value="0-100%" detail="global and wallet-specific" />
          <MetricCard icon={<Activity />} label="Tests" value="95" detail="Acton local gate" />
        </section>

        {activeTab === 'overview' && (
          <section className="content-grid two-columns">
            <ProposalTable
              selectedProposalId={selectedProposalId}
              onSelect={(proposalId) => {
                setSelectedProposalId(proposalId);
                setVoteForm((current) => ({ ...current, proposalId: String(proposalId) }));
              }}
            />
            <EventRail />
          </section>
        )}

        {activeTab === 'vote' && (
          <section className="content-grid two-columns">
            <VotePanel
              form={voteForm}
              proposal={selectedProposal}
              connectedAddress={connectedAddress}
              onChange={(patch) => setVoteForm((current) => ({ ...current, ...patch }))}
              onBuild={buildVotePreview}
              onSend={sendVote}
            />
            <TransactionPreview transaction={transactionPreview} status={statusMessage} error={errorMessage} />
          </section>
        )}

        {activeTab === 'propose' && (
          <section className="content-grid two-columns">
            <ProposalBuilder
              form={proposalForm}
              onChange={(patch) => setProposalForm((current) => ({ ...current, ...patch }))}
              onBuild={buildProposalPreview}
              onSend={sendProposal}
            />
            <TransactionPreview transaction={transactionPreview} status={statusMessage} error={errorMessage} />
          </section>
        )}

        {activeTab === 'contracts' && (
          <section className="contract-section">
            <div className="section-header">
              <h2>Contract registry</h2>
              <div className="social-links">
                {socialLinks.map((link) => (
                  <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
            <div className="contract-grid">
              {contractOrder.map((key) => (
                <ContractCard key={key} contractKey={key} network={network} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
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
        <h2>Proposal desk</h2>
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

function EventRail() {
  return (
    <section className="panel event-panel">
      <div className="section-header">
        <h2>DAO events</h2>
        <span className="status status-open">Active</span>
      </div>
      <div className="event-stack">
        <article className="event-item">
          <Landmark size={19} />
          <div>
            <strong>Satoshi Council</strong>
            <span>high-conviction governance round</span>
          </div>
        </article>
        <article className="event-item">
          <CircleDollarSign size={19} />
          <div>
            <strong>Fee Wars</strong>
            <span>buy/sell policy voting window</span>
          </div>
        </article>
        <article className="event-item">
          <Wallet size={19} />
          <div>
            <strong>Liquidity Defense</strong>
            <span>treasury-backed execution route</span>
          </div>
        </article>
      </div>
    </section>
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
        <strong>#{proposal.id} {proposal.title}</strong>
        <small>{proposal.execution}</small>
      </div>
      <label>
        Voter jetton wallet
        <input
          value={form.voterJettonWallet}
          onChange={(event) => onChange({ voterJettonWallet: event.target.value })}
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
        {error && <span className="status status-against">{error}</span>}
      </div>
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
