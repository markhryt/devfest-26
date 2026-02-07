'use client';

import { useMemo, useState } from 'react';
import { Lock, Play, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import type { BlockDefinition } from 'shared';
import { runBlock } from '@/lib/api';

type BlockCardProps = {
  block: BlockDefinition;
  icon: React.ReactNode;
  hasAccess: boolean;
  onUnlock: () => Promise<void>;
};

export function BlockCard({ block, icon, hasAccess, onUnlock }: BlockCardProps) {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [output, setOutput] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textInputs = useMemo(() => block.inputs.filter((input) => input.type === 'text'), [block.inputs]);
  const requiredMissing = textInputs.some((input) => input.required && !(inputs[input.key] ?? '').trim());

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setOutput(null);

    const payload: Record<string, string> = {};
    for (const input of textInputs) {
      payload[input.key] = inputs[input.key] ?? '';
    }

    try {
      const data = await runBlock({
        blockId: block.id,
        inputs: payload,
      });
      setOutput(data.outputs ?? {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run block');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    setUnlocking(true);
    setError(null);
    try {
      await onUnlock();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-app-card/90 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.25)] transition ${
        hasAccess ? 'border-app' : 'border-slate-600/60'
      }`}
    >
      {!hasAccess && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-900/35 to-slate-950/70 backdrop-blur-[2px]" />
      )}

      <div className="relative mb-3 flex items-start gap-3">
        <div className={`rounded-lg p-2 ${hasAccess ? 'bg-blue-500/15 text-blue-300' : 'bg-slate-700/60 text-slate-300'}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-app-fg">{block.name}</h2>
            {hasAccess ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                <CheckCircle2 className="h-3 w-3" />
                Unlocked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                <Lock className="h-3 w-3" />
                Locked
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-app-soft">{block.description}</p>
        </div>
      </div>

      <div className="relative mb-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-app px-2 py-1 text-app-soft">{block.priceSlug}</span>
        {block.usesAI && (
          <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/35 bg-blue-500/10 px-2 py-1 text-blue-300">
            <Sparkles className="h-3 w-3" /> AI
          </span>
        )}
      </div>

      <div className="relative space-y-2">
        {textInputs.length === 0 ? (
          <p className="text-xs text-app-soft">No text inputs required. Run directly when unlocked.</p>
        ) : (
          textInputs.map((input) => (
            <div key={input.key}>
              <label className="mb-1 block text-xs font-medium text-app-soft">{input.label}</label>
              <textarea
                value={inputs[input.key] ?? ''}
                onChange={(e) => setInputs((prev) => ({ ...prev, [input.key]: e.target.value }))}
                placeholder={input.required ? 'Required input' : 'Optional input'}
                rows={2}
                className="w-full resize-none rounded-lg border border-app bg-app-surface px-3 py-2 text-sm text-app-fg placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          ))
        )}
      </div>

      {block.inputs.some((input) => input.type === 'file') && (
        <p className="relative mt-3 text-xs text-app-soft">File input blocks are listed here but require integrated uploader support in a subsequent iteration.</p>
      )}

      <div className="relative mt-4 flex items-center gap-2">
        {hasAccess ? (
          <button
            onClick={handleRun}
            disabled={loading || requiredMissing}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Run
          </button>
        ) : (
          <button
            onClick={handleUnlock}
            disabled={unlocking}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {unlocking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            Unlock
          </button>
        )}
      </div>

      {error && <p className="relative mt-2 text-sm text-rose-300">{error}</p>}

      {output && (
        <pre className="relative mt-3 max-h-40 overflow-auto rounded-lg border border-app bg-app-surface p-3 text-xs text-app-fg">
          {JSON.stringify(output, null, 2)}
        </pre>
      )}
    </div>
  );
}
