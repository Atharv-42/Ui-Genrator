export interface ComponentNode {
  id: string;
  name: string;
  description: string;
  matches: number;
}

export type TokenCategory = "Colors" | "Typography" | "Spacing" | "Radius" | "Shadows";
export interface DesignToken { category: TokenCategory; value: string; usage: number; }

const componentRules: Array<[string, string, RegExp]> = [
  ["Navbar", "Primary navigation and header area", /<(?:nav|header)\b|\b(?:navbar|nav-)\b/gi],
  ["Sidebar", "Secondary navigation or contextual content", /<(?:aside)\b|\bsidebar\b/gi],
  ["Cards", "Grouped content surfaces", /\bcard\b|\brounded(?:-[\w-]+)?\b/gi],
  ["Buttons", "Interactive action controls", /<button\b|\b(?:bg|border)-\w+-\d{2,3}\b[^>]*\b(?:px|py)-/gi],
  ["Forms", "Inputs and form controls", /<(?:form|input|select|textarea)\b/gi],
  ["Footer", "Footer content and links", /<footer\b|\bfooter\b/gi],
];

const tokenRules: Array<[TokenCategory, RegExp]> = [
  ["Colors", /\b(?:bg|text|border|ring|from|to|via|divide)-(?:[a-z]+-\d{2,3}|(?:white|black|transparent|current|inherit))\b/g],
  ["Typography", /\b(?:text-(?:xs|sm|base|lg|xl|[2-9]xl)|font-(?:thin|light|normal|medium|semibold|bold|extrabold|black)|tracking-[\w-]+|leading-[\w-]+)\b/g],
  ["Spacing", /\b(?:p[trblxy]?|m[trblxy]?|gap|space-x|space-y)-(?:\d+(?:\.\d+)?|px|auto)\b/g],
  ["Radius", /\brounded(?:-(?:none|sm|md|lg|xl|2xl|3xl|full))?\b/g],
  ["Shadows", /\bshadow(?:-(?:sm|md|lg|xl|2xl|inner|none))?\b/g],
];

function countMatches(code: string, pattern: RegExp) {
  return [...code.matchAll(pattern)].length;
}

export function extractComponentTree(code: string): ComponentNode[] {
  return componentRules.map(([name, description, pattern]) => ({ id: name.toLowerCase(), name, description, matches: countMatches(code, pattern) })).filter((node) => node.matches > 0);
}

export function extractDesignTokens(code: string): DesignToken[] {
  return tokenRules.flatMap(([category, pattern]) => {
    const values = new Map<string, number>();
    for (const match of code.matchAll(pattern)) values.set(match[0], (values.get(match[0]) || 0) + 1);
    return [...values].map(([value, usage]) => ({ category, value, usage }));
  });
}

export function replaceToken(code: string, token: string, replacement: string) {
  if (!replacement.trim() || /\s/.test(replacement)) throw new Error("Enter one valid Tailwind utility class.");
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return code.replace(new RegExp(`\\b${escaped}\\b`, "g"), replacement.trim());
}

export function tokenSwatch(token: string) {
  const match = token.match(/(?:bg|text|border)-(\w+)-(\d{2,3})/);
  if (!match) return undefined;
  const [, color, shade] = match;
  return `var(--color-${color}-${shade})`;
}
