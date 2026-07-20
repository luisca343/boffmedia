/**
 * Mapping-pack (`.ruleset.json`) import / export.
 *
 * A rule set captures a session's block substitutions as portable `exact` rules
 * so they can be reused across projects. Export turns the current
 * {@link ResolutionMap} into rules; import validates an untrusted JSON file back
 * into a typed {@link RuleSet} (see §12 of the plan).
 */
import { parseBlockState } from "@/lib/schematic/normalizer";
import type { MappingRule, ResolutionMap, RuleSet, RuleSetMeta } from "@/lib/schematic/types";

/** Serialise the current per-block resolutions into a `.ruleset.json` string. */
export function buildRuleSet(resolutions: ResolutionMap, meta: RuleSetMeta): string {
  const rules: MappingRule[] = Object.entries(resolutions).map(([source, res]) => {
    const rule: MappingRule = { type: "exact", source, target: res.target.id };
    if (res.stateMap && Object.keys(res.stateMap).length > 0) rule.stateMap = res.stateMap;
    return rule;
  });

  const ruleSet: RuleSet = { formatVersion: 1, ...meta, rules };
  return JSON.stringify(ruleSet, null, 2);
}

function isMappingRule(value: unknown): value is MappingRule {
  if (typeof value !== "object" || value === null) return false;
  const r = value as Record<string, unknown>;
  switch (r.type) {
    case "exact":
      return typeof r.source === "string" && typeof r.target === "string";
    case "namespace":
      return typeof r.sourceNs === "string" && typeof r.targetNs === "string";
    case "tag":
      return typeof r.tag === "string" && typeof r.target === "string";
    case "fallback":
      return typeof r.target === "string";
    default:
      return false;
  }
}

/** Validate untrusted JSON into a typed {@link RuleSet}; throws on malformed input. */
export function parseRuleSet(json: string): RuleSet {
  let obj: unknown;
  try {
    obj = JSON.parse(json);
  } catch {
    throw new Error("Rule set is not valid JSON");
  }
  if (typeof obj !== "object" || obj === null) throw new Error("Rule set must be an object");

  const o = obj as Record<string, unknown>;
  if (o.formatVersion !== 1) throw new Error("Unsupported rule set formatVersion");
  if (!Array.isArray(o.rules)) throw new Error("Rule set is missing a rules array");

  const rules = o.rules.filter(isMappingRule);

  const gameId = o.gameId === "hytale" ? "hytale" : "minecraft";

  return {
    formatVersion: 1,
    id: typeof o.id === "string" ? o.id : "imported-ruleset",
    name: typeof o.name === "string" ? o.name : "Imported Rule Set",
    gameId,
    fromVersion: typeof o.fromVersion === "string" ? o.fromVersion : "?",
    toVersion: typeof o.toVersion === "string" ? o.toVersion : "?",
    rules,
  };
}

/**
 * The `exact` source→target pairs from a rule set, as `{ source, targetId }`
 * tuples. The UI applies these to the current diff (the broader rule types are
 * consumed engine-side by `applyRules` during analysis).
 */
export function exactRulePairs(ruleSet: RuleSet): Array<{ source: string; targetId: string }> {
  return ruleSet.rules
    .filter((r): r is Extract<MappingRule, { type: "exact" }> => r.type === "exact")
    .map((r) => ({ source: r.source, targetId: r.target }));
}

/** Construct a UnifiedBlock from a target block id string (for store resolutions). */
export { parseBlockState };
