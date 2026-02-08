export type BlockId =
  | 'summarize-text'
  | 'extract-emails'
  | 'rewrite-prompt'
  | 'classify-input'
  | 'merge-pdfs'
  | 'trigger'
  | 'text-join'
  | 'constant'
  | 'conditional';

export interface BlockDefinition {
  id: BlockId;
  name: string;
  description: string;
  icon: string;
  /** Flowglad feature slug for entitlement gating */
  featureSlug: string;
  /** Flowglad price slug for checkout (usage or subscription) */
  priceSlug: string;
  /** Optional fallback price slugs (tried in order after priceSlug) */
  checkoutPriceSlugs?: string[];
  /** Flowglad usage meter slug for usage-based billing */
  usageMeterSlug?: string;
  /** Whether block uses Claude/GPT (true) or backend-only (false) */
  usesAI: boolean;
  /** Optional checkout metadata resolved from Flowglad pricing model */
  priceName?: string | null;
  /** Price per unit in smallest currency unit (e.g. cents) */
  priceUnitAmount?: number;
  priceCurrency?: string;
  priceType?: 'single_payment' | 'subscription' | 'usage';
  inputs: { key: string; label: string; type: 'text' | 'file'; required?: boolean }[];
  outputs: { key: string; label: string }[];
}

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  {
    id: 'summarize-text',
    name: 'Summarize Text',
    description: 'TL;DR summary of a user-pasted document.',
    icon: 'Brain',
    featureSlug: 'summarize_text',
    priceSlug: 'summarize_text',
    checkoutPriceSlugs: ['dummy5'],
    usageMeterSlug: 'summarize_text_runs',
    usesAI: true,
    inputs: [{ key: 'text', label: 'Text to summarize', type: 'text', required: true }],
    outputs: [{ key: 'summary', label: 'Summary' }],
  },
  {
    id: 'extract-emails',
    name: 'Extract Emails',
    description: 'Extract all email addresses from raw text.',
    icon: 'Mail',
    featureSlug: 'extract_emails',
    priceSlug: 'extract_emails',
    checkoutPriceSlugs: ['dummy5'],
    usageMeterSlug: 'extract_emails_runs',
    usesAI: true,
    inputs: [{ key: 'text', label: 'Text to scan', type: 'text', required: true }],
    outputs: [{ key: 'emails', label: 'Extracted emails' }],
  },
  {
    id: 'rewrite-prompt',
    name: 'Rewrite Prompt',
    description: 'Reframe user input for clarity and structure.',
    icon: 'PenLine',
    featureSlug: 'rewrite_prompt',
    priceSlug: 'rewrite_prompt',
    checkoutPriceSlugs: ['dummy5'],
    usageMeterSlug: 'rewrite_prompt_runs',
    usesAI: true,
    inputs: [{ key: 'text', label: 'Input to rewrite', type: 'text', required: true }],
    outputs: [{ key: 'rewritten', label: 'Rewritten text' }],
  },
  {
    id: 'classify-input',
    name: 'Classify Input',
    description: 'Label text as positive, neutral, or negative.',
    icon: 'TestTube',
    featureSlug: 'classify_input',
    priceSlug: 'classify_input',
    checkoutPriceSlugs: ['dummy5'],
    usageMeterSlug: 'classify_input_runs',
    usesAI: true,
    inputs: [{ key: 'text', label: 'Text to classify', type: 'text', required: true }],
    outputs: [{ key: 'label', label: 'Sentiment' }, { key: 'confidence', label: 'Confidence' }],
  },
  {
    id: 'merge-pdfs',
    name: 'Merge PDFs',
    description: 'Merge multiple PDF files into one (subscription-only).',
    icon: 'FileStack',
    featureSlug: 'merge_pdfs',
    priceSlug: 'merge_pdfs',
    checkoutPriceSlugs: ['dummy5'],
    usesAI: false,
    inputs: [
      { key: 'files', label: 'PDF files', type: 'file', required: true },
    ],
    outputs: [{ key: 'mergedUrl', label: 'Download link' }],
  },
  // --- Workflow utility blocks (free, no billing) ---
  {
    id: 'trigger',
    name: 'Trigger',
    description: 'Start of a workflow. No inputs; outputs a signal so other blocks can depend on it.',
    icon: 'Play',
    featureSlug: 'free',
    priceSlug: 'free',
    usesAI: false,
    inputs: [],
    outputs: [{ key: 'trigger', label: 'Signal' }],
  },
  {
    id: 'text-join',
    name: 'Text Join',
    description: 'Combine two text inputs into one, with an optional separator.',
    icon: 'Layers',
    featureSlug: 'free',
    priceSlug: 'free',
    usesAI: false,
    inputs: [
      { key: 'text1', label: 'First text', type: 'text', required: true },
      { key: 'text2', label: 'Second text', type: 'text', required: true },
      { key: 'separator', label: 'Separator (e.g. space)', type: 'text', required: false },
    ],
    outputs: [{ key: 'combined', label: 'Combined text' }],
  },
  {
    id: 'constant',
    name: 'Constant',
    description: 'Output a fixed value you type in. Use as manual input or template in a workflow.',
    icon: 'Type',
    featureSlug: 'free',
    priceSlug: 'free',
    usesAI: false,
    inputs: [{ key: 'value', label: 'Value', type: 'text', required: true }],
    outputs: [{ key: 'value', label: 'Value' }],
  },
  {
    id: 'conditional',
    name: 'Conditional',
    description: 'Check if text is non-empty or contains a pattern. Outputs true/false for branching.',
    icon: 'GitBranch',
    featureSlug: 'free',
    priceSlug: 'free',
    usesAI: false,
    inputs: [
      { key: 'text', label: 'Text to check', type: 'text', required: true },
      { key: 'pattern', label: 'Contains (optional)', type: 'text', required: false },
    ],
    outputs: [{ key: 'match', label: 'Match result' }],
  },
];

export function getBlockById(id: BlockId): BlockDefinition | undefined {
  return BLOCK_DEFINITIONS.find((b) => b.id === id);
}
