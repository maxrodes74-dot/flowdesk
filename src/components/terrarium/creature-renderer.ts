/**
 * Creature Renderer — Canvas 2D drawing for graph nodes
 *
 * Each note is drawn as a pixel-art-style creature with:
 * - Body: rounded blob shape, color from cluster
 * - Eyes: two circles indicating state
 * - Size: based on content volume
 * - Glow: based on recency (brighter = more recent)
 */

// Color palette from spec
const CLUSTER_COLORS: Record<string, string> = {
  default: '#4a9ead',     // Deep Teal
  technical: '#7c6fe0',   // Soft Purple
  creative: '#e0a86f',    // Warm Amber
  research: '#6fe08a',    // Moss Green
  personal: '#e06f8a',    // Dusty Rose
  meta: '#8a8a9e',        // Slate
  new: '#e0e0f0',         // Ghost White
  stale: '#3a3a4a',       // Charcoal
};

// Assign colors based on simple heuristics for now
// Later this will come from cluster data
const TAG_COLOR_MAP: Record<string, string> = {
  technical: CLUSTER_COLORS.technical,
  engineering: CLUSTER_COLORS.technical,
  code: CLUSTER_COLORS.technical,
  dev: CLUSTER_COLORS.technical,
  creative: CLUSTER_COLORS.creative,
  writing: CLUSTER_COLORS.creative,
  design: CLUSTER_COLORS.creative,
  research: CLUSTER_COLORS.research,
  learning: CLUSTER_COLORS.research,
  study: CLUSTER_COLORS.research,
  personal: CLUSTER_COLORS.personal,
  journal: CLUSTER_COLORS.personal,
  diary: CLUSTER_COLORS.personal,
  meta: CLUSTER_COLORS.meta,
  system: CLUSTER_COLORS.meta,
};

export type CreatureNode = {
  id: string;
  title: string;
  contentLength: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  // d3-force adds these
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
};

/**
 * Calculate creature size based on content length
 * Min 8px radius, max 28px, logarithmic scale
 */
export function getCreatureSize(contentLength: number): number {
  if (contentLength === 0) return 8;
  return Math.min(28, 8 + Math.log2(contentLength + 1) * 2);
}

/**
 * Get creature color based on tags
 */
export function getCreatureColor(tags: string[]): string {
  for (const tag of tags) {
    const lower = tag.toLowerCase();
    if (TAG_COLOR_MAP[lower]) return TAG_COLOR_MAP[lower];
  }
  return CLUSTER_COLORS.default;
}

/**
 * Calculate glow intensity based on recency (0 to 1)
 * Full glow within last 24h, fading over 7 days
 */
export function getGlowIntensity(updatedAt: string): number {
  const now = Date.now();
  const updated = new Date(updatedAt).getTime();
  const hoursSince = (now - updated) / (1000 * 60 * 60);

  if (hoursSince < 24) return 1;
  if (hoursSince > 168) return 0.15; // 7 days
  return 1 - (hoursSince - 24) / (168 - 24) * 0.85;
}

/**
 * Check if a note is stale (90+ days without update)
 */
function isStale(updatedAt: string): boolean {
  const daysSince = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince > 90;
}

/**
 * Draw a creature on the canvas
 * This is called by react-force-graph-2d's nodeCanvasObject
 */
export function drawCreature(
  node: CreatureNode,
  ctx: CanvasRenderingContext2D,
  globalScale: number,
  isHovered: boolean,
  isSelected: boolean
) {
  const x = node.x || 0;
  const y = node.y || 0;
  const size = getCreatureSize(node.contentLength);
  const baseColor = isStale(node.updatedAt) ? CLUSTER_COLORS.stale : getCreatureColor(node.tags);
  const glow = getGlowIntensity(node.updatedAt);

  // Breathing animation — subtle size oscillation
  const breathPhase = (Date.now() / 2000 + hashCode(node.id) * 0.1) % (Math.PI * 2);
  const breathScale = 1 + Math.sin(breathPhase) * 0.02;
  const r = size * breathScale;

  // --- Glow effect ---
  if (glow > 0.2 || isHovered || isSelected) {
    const glowRadius = r * (isHovered ? 2.5 : isSelected ? 2.2 : 1.8);
    const glowAlpha = isHovered ? 0.4 : isSelected ? 0.35 : glow * 0.25;
    const gradient = ctx.createRadialGradient(x, y, r * 0.5, x, y, glowRadius);
    gradient.addColorStop(0, hexToRgba(baseColor, glowAlpha));
    gradient.addColorStop(1, hexToRgba(baseColor, 0));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Body ---
  // Draw a blobby body (slightly irregular circle for organic feel)
  ctx.fillStyle = baseColor;
  ctx.beginPath();
  const segments = 8;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const wobble = 1 + Math.sin(angle * 3 + hashCode(node.id)) * 0.08;
    const px = x + Math.cos(angle) * r * wobble;
    const py = y + Math.sin(angle) * r * wobble;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // Body highlight (top-left)
  const highlightGradient = ctx.createRadialGradient(
    x - r * 0.3, y - r * 0.3, 0,
    x, y, r
  );
  highlightGradient.addColorStop(0, 'rgba(255,255,255,0.15)');
  highlightGradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = highlightGradient;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // --- Eyes ---
  const eyeSize = Math.max(1.5, r * 0.18);
  const eyeSpacing = r * 0.3;
  const eyeY = y - r * 0.1;

  // Eye whites
  ctx.fillStyle = '#e0e0f0';
  ctx.beginPath();
  ctx.arc(x - eyeSpacing, eyeY, eyeSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + eyeSpacing, eyeY, eyeSize, 0, Math.PI * 2);
  ctx.fill();

  // Pupils
  const pupilSize = eyeSize * 0.55;
  ctx.fillStyle = '#0a0a0f';
  ctx.beginPath();
  ctx.arc(x - eyeSpacing, eyeY, pupilSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + eyeSpacing, eyeY, pupilSize, 0, Math.PI * 2);
  ctx.fill();

  // --- Selection ring ---
  if (isSelected) {
    ctx.strokeStyle = '#f5c542';
    ctx.lineWidth = 2 / globalScale;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(x, y, r + 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  // --- Label (only at sufficient zoom) ---
  if (globalScale > 0.8) {
    const fontSize = Math.max(10, 12 / globalScale);
    ctx.font = `${fontSize}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = hexToRgba('#e0e0f0', isHovered ? 0.95 : 0.7);

    const label = node.title.length > 20 ? node.title.slice(0, 18) + '…' : node.title;
    ctx.fillText(label, x, y + r + 4);
  }
}

/**
 * Draw an edge between two creatures
 */
export function drawLink(
  link: { source: CreatureNode; target: CreatureNode; autoGenerated?: boolean },
  ctx: CanvasRenderingContext2D,
  globalScale: number
) {
  const sx = link.source.x || 0;
  const sy = link.source.y || 0;
  const tx = link.target.x || 0;
  const ty = link.target.y || 0;

  const sourceColor = getCreatureColor(link.source.tags);

  ctx.strokeStyle = hexToRgba(sourceColor, link.autoGenerated ? 0.15 : 0.25);
  ctx.lineWidth = 1 / globalScale;

  if (link.autoGenerated) {
    ctx.setLineDash([4 / globalScale, 4 / globalScale]);
  } else {
    ctx.setLineDash([]);
  }

  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(tx, ty);
  ctx.stroke();

  ctx.setLineDash([]);
}

// --- Utilities ---

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
