interface ModelPricing {
  inputPerMillion: number
  outputPerMillion: number
}

const PRICING: Record<string, ModelPricing> = {
  'claude-opus-4-0-20250514': { inputPerMillion: 15, outputPerMillion: 75 },
  'claude-sonnet-4-0-20250514': { inputPerMillion: 3, outputPerMillion: 15 },
  'claude-haiku-3-5-20241022': { inputPerMillion: 0.25, outputPerMillion: 1.25 }
}

// Fallback matching by substring
function findPricing(model: string): ModelPricing {
  if (PRICING[model]) return PRICING[model]
  if (model.includes('opus')) return PRICING['claude-opus-4-0-20250514']
  if (model.includes('sonnet')) return PRICING['claude-sonnet-4-0-20250514']
  if (model.includes('haiku')) return PRICING['claude-haiku-3-5-20241022']
  return { inputPerMillion: 3, outputPerMillion: 15 } // default to sonnet
}

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = findPricing(model)
  return (inputTokens / 1_000_000) * pricing.inputPerMillion +
    (outputTokens / 1_000_000) * pricing.outputPerMillion
}
