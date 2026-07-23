import { useCallback, useEffect, useState } from "react";
import { HrmsClient, TransferSliceSummary } from "../../api/hrmsClient";
import { OperationalState } from "../../app/OperationalStates";
import { loadSliceView, SliceViewState } from "../sliceViewState";
import { TransferInitiateForm } from "./TransferInitiateForm";
import { TransferOrdersList } from "./TransferOrdersList";

export type TransferViewState = SliceViewState<TransferSliceSummary>;

/** Loads the newest PS05 transfer order from GET /api/v1/transfers/orders via the injected client. */
export function loadTransferView(client: HrmsClient): Promise<TransferViewState> {
  return loadSliceView(() => client.getTransferSlice());
}

export interface TransferWorkspaceProps {
  client: HrmsClient;
  /** Pre-resolved view state for tests/server rendering; the live fetch replaces it on mount. */
  initialState?: TransferViewState;
}

/**
 * PH-06D PS05 workspace: the initiate-transfer form and orders list are the working
 * demo surfaces; the vertical-slice evidence panel keeps the PH-06 proof visible.
 */
export function TransferWorkspace({ client, initialState }: TransferWorkspaceProps) {
  const [state, setState] = useState<TransferViewState>(initialState ?? { kind: "loading" });
  const [refreshToken, setRefreshToken] = useState(0);

  const refresh = useCallback(() => setRefreshToken((token) => token + 1), []);

  useEffect(() => {
    let mounted = true;
    setState({ kind: "loading" });
    void loadTransferView(client).then((next) => {
      if (mounted) {
        setState(next);
      }
    });
    return () => {
      mounted = false;
    };
  }, [client, refreshToken]);

  return (
    <div className="module-workspace" aria-label="PS05 transfer workspace">
      <TransferInitiateForm client={client} onInitiated={refresh} />
      <TransferOrdersList client={client} refreshToken={refreshToken} />
      <TransferEvidencePanel state={state} />
    </div>
  );
}

function TransferEvidencePanel({ state }: { state: TransferViewState }) {
  if (state.kind === "loading") {
    return <OperationalState kind="loading" title="Loading Transfers" detail="Fetching the PS05 transfer order summary." />;
  }
  if (state.kind === "error") {
    return (
      <OperationalState
        kind="error"
        title="Could not load Transfers"
        detail={`The PS05 transfer fetch failed with error code ${state.errorCode}.`}
      />
    );
  }
  if (state.kind === "empty") {
    return <OperationalState kind="empty" title="No transfer orders" detail="No PS05 transfer orders are in scope." />;
  }

  const slice = state.slice;
  return (
    <article
      className="record-panel vertical-slice-panel"
      aria-label="PS05 transfer vertical slice"
      data-workflow-resolver="POSITION_AUTHORITY"
      data-clearance-pattern="PARALLEL_ALL_OF"
      data-deemed-state="DEEMED_CLEARED"
      data-sr-event="TRANSFER_JOINED"
    >
      <div className="panel-heading">
        <div>
          <p className="eyebrow">PS05 Transfer</p>
          <h2>Relieving & Joining Proof</h2>
        </div>
        <strong>{slice.status}</strong>
      </div>
      <dl className="record-facts">
        <div>
          <dt>Order</dt>
          <dd>{slice.orderNo}</dd>
        </div>
        <div>
          <dt>Resolver</dt>
          <dd>{slice.resolver}</dd>
        </div>
        <div>
          <dt>Clearance</dt>
          <dd>{slice.clearancePattern}</dd>
        </div>
        <div>
          <dt>Documents</dt>
          <dd>{slice.documentCount} PS13 records</dd>
        </div>
      </dl>
      <ul className="slice-evidence" aria-label="PS05 transfer evidence">
        {slice.clearances.map((clearance) => (
          <li key={clearance.code}>
            {clearance.code}: {clearance.status}
          </li>
        ))}
        <li>PS12 event {slice.srEventType}</li>
      </ul>
    </article>
  );
}
