/**
 * Rule engine — applies an ordered list of {@link RuleSet}s to find a target
 * block for a given source block.
 *
 * Rule priority within a set (first match wins):
 *   exact → namespace → tag (high-priority first, then default) → fallback
 *
 * Sets are tried in order; the first set that produces a match wins.
 * Returns null if no rule matches (caller falls back to rename detection or
 * marks the block as missing/mod-only).
 */
import type { MappingRule, RuleSet, UnifiedBlock, BlockRegistry } from "@/lib/schematic/types";
import { parseBlockState } from "@/lib/schematic/normalizer";

export function applyRules(
  block: UnifiedBlock,
  ruleSets: RuleSet[],
  targetReg: BlockRegistry
): UnifiedBlock | null {
  for (const ruleSet of ruleSets) {
    const result = applyRuleSet(block, ruleSet.rules, targetReg);
    if (result) return result;
  }
  return null;
}

function applyRuleSet(
  block: UnifiedBlock,
  rules: MappingRule[],
  targetReg: BlockRegistry
): UnifiedBlock | null {
  // Stable ordering: exact → namespace → tag-high → tag-normal/low → fallback
  const ordered: MappingRule[] = [
    ...rules.filter((r) => r.type === "exact"),
    ...rules.filter((r) => r.type === "namespace"),
    ...rules.filter((r) => r.type === "tag" && r.priority === "high"),
    ...rules.filter((r) => r.type === "tag" && r.priority !== "high"),
    ...rules.filter((r) => r.type === "fallback"),
  ];

  for (const rule of ordered) {
    const result = matchRule(block, rule, targetReg);
    if (result !== null) return result;
  }
  return null;
}

function matchRule(
  block: UnifiedBlock,
  rule: MappingRule,
  targetReg: BlockRegistry
): UnifiedBlock | null {
  switch (rule.type) {
    case "exact": {
      if (block.id !== rule.source) return null;
      if (!targetReg.blocks.has(rule.target)) return null;
      return parseBlockState(rule.target);
    }

    case "namespace": {
      if (block.namespace !== rule.sourceNs) return null;
      const targetId = `${rule.targetNs}:${block.name}`;
      if (!targetReg.blocks.has(targetId)) return null;
      return parseBlockState(targetId);
    }

    case "tag": {
      // Tags are populated by the JAR scanner (Phase 2b+).
      // Phase 2 bundled registries have empty tag arrays, so this branch
      // fires only after a real registry scan.
      if (!block.tags.includes(rule.tag)) return null;
      if (!targetReg.blocks.has(rule.target)) return null;
      return parseBlockState(rule.target);
    }

    case "fallback": {
      const target = targetReg.blocks.has(rule.target)
        ? rule.target
        : "minecraft:air";
      return parseBlockState(target);
    }
  }
}
