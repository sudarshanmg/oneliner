const ADJECTIVES = [
  "Silver", "Crimson", "Amber", "Jade", "Violet",
  "Shadow", "Golden", "Iron", "Frost", "Storm",
  "Ancient", "Swift", "Silent", "Burning", "Pale",
  "Dark", "Bright", "Wild", "Lost", "Hollow",
];

const ANIMALS = [
  "Fox", "Wolf", "Raven", "Bear", "Hawk",
  "Stag", "Lynx", "Owl", "Serpent", "Falcon",
  "Drake", "Hound", "Mare", "Boar", "Crane",
  "Elk", "Viper", "Toad", "Moth", "Crow",
];

// Simple hash function for deterministic derivation
function hash(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h = h >>> 0; // keep unsigned 32-bit
  }
  return h;
}

export function deriveFantasyName(token: string): string {
  const h1 = hash(token + "adj");
  const h2 = hash(token + "ani");
  const h3 = hash(token + "num");

  const adj = ADJECTIVES[h1 % ADJECTIVES.length];
  const animal = ANIMALS[h2 % ANIMALS.length];
  const num = (h3 % 9000) + 1000;

  return `${adj}${animal}#${num}`;
}

export function generateIdenticon(token: string): string {
  const GRID = 5;
  const CELL = 10;
  const SIZE = GRID * CELL;

  // Generate a color from the token
  const h = hash(token + "color");
  const hue = h % 360;
  const saturation = 60 + (h % 30);
  const lightness = 45 + (h % 20);
  const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  const bg = "#1a1a1a";

  // Generate cell pattern (symmetric left-right)
  const cells: boolean[] = [];
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < Math.ceil(GRID / 2); col++) {
      const cellHash = hash(token + `cell${row}${col}`);
      cells.push(cellHash % 2 === 0);
    }
  }

  let rects = "";
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      const mirrorCol = col < Math.ceil(GRID / 2) ? col : GRID - 1 - col;
      const idx = row * Math.ceil(GRID / 2) + mirrorCol;
      if (cells[idx]) {
        rects += `<rect x="${col * CELL}" y="${row * CELL}" width="${CELL}" height="${CELL}" fill="${color}"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="${bg}"/>
  ${rects}
</svg>`;
}

export function generateToken(): string {
  return crypto.randomUUID();
}
