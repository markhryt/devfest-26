'use client';

import { useState, useMemo } from 'react';
import { X, Play, Loader2, Lock, Link2, Coins } from 'lucide-react';
import { getBlockById, type BlockId } from 'shared';
import { useAppBilling } from '@/contexts/AppBillingContext';
import { useTokens } from '@/contexts/TokenContext';
import { useExecutionLog } from '@/store/executionLog';
import { useFlowRunStore } from '@/store/flowRunStore';
import { getInputSource } from '@/lib/workflowLogic';
import type { Node, Edge } from '@xyflow/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

type NodeData = { blockId: string; label: string; icon?: string };

export function RunBlockPanel({
  nodeId,
  data,
  nodes = [],
  edges = [],
  onClose,
}: {
  nodeId: string;
  data: NodeData;
  nodes?: Node[];
  edges?: Edge[];
  onClose: () => void;
}) {
  const block = getBlockById(data.blockId as BlockId);
  const { checkFeatureAccess, createCheckoutSession, loaded } = useAppBilling();
  const { balance, deductLocally, refresh: refreshTokens } = useTokens();
  const hasAccess = DEMO_MODE || (loaded && (checkFeatureAccess?.(block?.featureSlug ?? '') ?? false));
  const getOutput = useFlowRunStore((s) => s.getOutput);
  const setNodeOutput = useFlowRunStore((s) => s.setNodeOutput);
  const getOutputs = useFlowRunStore((s) => s.outputsByNode[nodeId]);

  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [output, setOutput] = useState<Record<string, unknown> | null>(() => getOutputs ?? null);
  const [error, setError] = useState<string | null>(null);
  const [needsTokens, setNeedsTokens] = useState(false);
  const [loading, setLoading] = useState(false);
  const logAdd = useExecutionLog((s) => s.add);

  const textInputs = block?.inputs?.filter((i) => i.type === 'text') ?? [];
  const inputSources = useMemo(() => {
    return textInputs.map((input) => ({
      ...input,
      source: getInputSource(nodeId, input.key, edges, nodes),
    }));
  }, [nodeId, textInputs, edges, nodes]);

  const resolvedInputs = useMemo(() => {
    const out: Record<string, string> = {};
    inputSources.forEach(({ key, source }) => {
      if (source.type === 'connected') {
        const v = getOutput(source.sourceNodeId, source.sourceHandle);
        out[key] = v != null ? String(v) : '';
      } else {
        out[key] = inputs[key] ?? '';
      }
    });
    return out;
  }, [inputSources, getOutput, inputs]);

  const hasMissingConnected = inputSources.some(({ source }) => {
    if (source.type !== 'connected') return false;
    const v = getOutput(source.sourceNodeId, source.sourceHandle);
    return v === undefined || v === null;
  });
  const missingLabel = hasMissingConnected
    ? inputSources.find(({ source }) => source.type === 'connected' && getOutput(source.sourceNodeId, source.sourceHandle) == null)?.source
    : null;

  if (!block) {
    return (
      <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-800 w-96">
        <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-400">Unknown block</span>
          <button onClick={onClose} className="p-1 rounded hover:bg-zinc-800 text-zinc-400">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 text-zinc-500 text-sm">Block definition not found.</div>
      </div>
    );
  }

  const handleRun = async () => {
    if (!hasAccess) return;
    setLoading(true);
    setError(null);
    setNeedsTokens(false);
    setOutput(null);
    const payload = { ...resolvedInputs };
    try {
      const res = await fetch(`${API_URL}/api/run-block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': 'demo-user-2' },
        body: JSON.stringify({ blockId: block.id, inputs: payload }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 402 && json.needsPurchase) {
          setError(`Insufficient tokens. Need ${json.tokenCost}, you have ${json.currentBalance}.`);
          setNeedsTokens(true);
          logAdd({ blockName: data.label, blockId: block.id, success: false, error: 'Insufficient tokens' });
          return;
        }
        const errMsg =
          json.priceSlug && res.status === 403
            ? 'Block is locked. Unlock it from Block Library or Checkout.'
            : json.error ?? 'Failed to run block';
        setError(errMsg);
        logAdd({ blockName: data.label, blockId: block.id, success: false, error: errMsg });
        return;
      }
      // Deduct locally to update UI before next refresh
      if (block.tokenCost > 0) {
        deductLocally(block.tokenCost);
      }
      const outputs = json.outputs ?? {};
      setOutput(outputs);
      setNodeOutput(nodeId, outputs);
      logAdd({ blockName: data.label, blockId: block.id, success: true, output: outputs });
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'Request failed';
      setError(errMsg);
      logAdd({ blockName: data.label, blockId: block.id, success: false, error: errMsg });
    } finally {
      setLoading(false);
      refreshTokens();
    }
  };

  const canRun =
    !hasMissingConnected &&
    (!block.inputs.some((i) => i.required) || textInputs.every((i) => (resolvedInputs[i.key] ?? '').trim()));

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-800 w-96 shrink-0">
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-100">Run: {data.label}</span>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-zinc-800 text-zinc-400"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!hasAccess ? (
          <div className="rounded-lg border border-amber-700/50 bg-amber-900/20 p-3 text-sm text-amber-200">
            <p className="flex items-center gap-2 mb-2">
              <Lock className="h-4 w-4" />
              This block is locked
            </p>
            <p className="text-amber-200/80 mb-3">Unlock it from Block Library or Checkout to run it here.</p>
            <button
              onClick={() =>
                createCheckoutSession?.({
                  priceSlug: block.priceSlug,
                  successUrl: window.location.href,
                  cancelUrl: window.location.href,
                  autoRedirect: true,
                })
              }
              className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-500"
            >
              Unlock block
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-zinc-500">
              Inputs from connected blocks use cached output from the last run. Run upstream blocks first, or use Run workflow.
            </p>
            {inputSources.map(({ key, label, source }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-zinc-400 mb-1">{label}</label>
                {source.type === 'connected' ? (
                  <div className="rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <Link2 className="h-3.5 w-3.5 shrink-0" />
                      From {source.sourceLabel}.{source.sourceHandle}
                    </div>
                    {getOutput(source.sourceNodeId, source.sourceHandle) != null ? (
                      <p className="mt-1 text-zinc-300 truncate" title={String(getOutput(source.sourceNodeId, source.sourceHandle))}>
                        {String(getOutput(source.sourceNodeId, source.sourceHandle))}
                      </p>
                    ) : (
                      <p className="mt-1 text-amber-400">Run upstream block first</p>
                    )}
                  </div>
                ) : (
                  <textarea
                    placeholder={block.inputs?.find((i) => i.key === key)?.required ? 'Required' : 'Optional'}
                    value={inputs[key] ?? ''}
                    onChange={(e) => setInputs((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none resize-none"
                    rows={2}
                  />
                )}
              </div>
            ))}
            {block.inputs.some((i) => i.type === 'file') && (
              <p className="text-xs text-zinc-500">File inputs: use Block Library for this block.</p>
            )}
            {missingLabel && missingLabel.type === 'connected' && (
              <p className="text-xs text-amber-400">Run &quot;{missingLabel.sourceLabel}&quot; first to fill connected inputs.</p>
            )}
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={handleRun}
                disabled={loading || !canRun}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Run
              </button>
              {block.tokenCost > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-amber-400">
                  <Coins className="h-3.5 w-3.5" />
                  <span>{block.tokenCost} token{block.tokenCost !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {output != null && (
          <div>
            <p className="text-xs font-medium text-zinc-400 mb-1">Output (cached for downstream)</p>
            <pre className="rounded-lg bg-zinc-800 p-3 text-xs text-zinc-300 overflow-auto max-h-48">
              {JSON.stringify(output, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
