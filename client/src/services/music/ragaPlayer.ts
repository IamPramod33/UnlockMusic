import { audioPlayer } from '../audio';
import type { ScaleKey } from './scalePatterns';

export type Swara = 'S'|'R1'|'R2'|'R3'|'G1'|'G2'|'G3'|'M1'|'M2'|'P'|'D1'|'D2'|'D3'|'N1'|'N2'|'N3';

export type RagaDef = {
  id: string;
  name: string;
  mela?: number;
  arohana: Swara[];
  avarohana: Swara[];
};

// Semitone offsets relative to tonic (Sa)
const SWARA_OFFSETS: Record<Swara, number> = {
  S: 0,
  R1: 1, R2: 2, R3: 3,
  G1: 2, G2: 3, G3: 4,
  M1: 5, M2: 6,
  P: 7,
  D1: 8, D2: 9, D3: 10,
  N1: 9, N2: 10, N3: 11,
};

const NOTES: ScaleKey[] = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

function noteNameFor(tonic: ScaleKey, semitoneOffset: number, octave: number): string {
  const baseIndex = NOTES.indexOf(tonic);
  const val = baseIndex + semitoneOffset;
  const idx = ((val % 12) + 12) % 12;
  const octaveAdj = Math.floor(val / 12);
  const base = NOTES[idx];
  return `${base}${octave + octaveAdj}`;
}

// Generate 72 Melakarta ragas programmatically using standard swara patterns per Chakra.
// Reference: Each Chakra contains 6 ragas varying by R/G and D/N (M1 for melas 1–36, M2 for 37–72).
type Pattern = { r: 'R1'|'R2'|'R3'; g: 'G1'|'G2'|'G3'; m: 'M1'|'M2'; d: 'D1'|'D2'|'D3'; n: 'N1'|'N2'|'N3' };

type ChakraPattern = { mela: number } & Pattern;
const CHAKRA_PATTERNS: ChakraPattern[] = [];

// Build patterns (6 per Chakra):
// For Chakras 1–6 (M1, R/G from [R1G1, R1G2, R1G3, R2G2, R2G3, R3G3], D/N from [D1N1, D1N2, D1N3, D2N2, D2N3, D3N3] mapped across chakras)
// This is a simplified generator that matches standard 72 mapping nomenclature; names are placeholders using Mela numbers.
for (let mela = 1; mela <= 72; mela += 1) {
  const chakra = Math.ceil(mela / 6); // 1..12
  const pos = (mela - 1) % 6; // 0..5 within chakra
  const usesM2 = mela > 36;
  const m: Pattern['m'] = usesM2 ? 'M2' : 'M1';

  // Map pos to R/G choices
  const rg: Array<[Pattern['r'], Pattern['g']]> = [
    ['R1','G1'], ['R1','G2'], ['R1','G3'], ['R2','G2'], ['R2','G3'], ['R3','G3'],
  ];
  const [r, g] = rg[pos];

  // Map chakra to D/N pairs (1..12): 1,2 -> D1N1; 3,4 -> D1N2; 5,6 -> D1N3; 7,8 -> D2N2; 9,10 -> D2N3; 11,12 -> D3N3
  let d: Pattern['d'] = 'D1';
  let n: Pattern['n'] = 'N1';
  if (chakra <= 2) { d = 'D1'; n = 'N1'; }
  else if (chakra <= 4) { d = 'D1'; n = 'N2'; }
  else if (chakra <= 6) { d = 'D1'; n = 'N3'; }
  else if (chakra <= 8) { d = 'D2'; n = 'N2'; }
  else if (chakra <= 10) { d = 'D2'; n = 'N3'; }
  else { d = 'D3'; n = 'N3'; }

  CHAKRA_PATTERNS.push({ mela, r, g, m, d, n } as any);
}

export const RAGAS: RagaDef[] = CHAKRA_PATTERNS.map((p) => {
  const arohana: Swara[] = ['S', p.r, p.g, p.m, 'P', p.d, p.n, 'S'];
  const avarohana: Swara[] = ['S', p.n, p.d, 'P', p.m, p.g, p.r, 'S'];
  const MELAKARTA_NAMES: string[] = [
    'Kanakangi','Ratnangi','Ganamurti','Vanaspati','Manavati','Tanarupi',
    'Senavati','Hanumatodi','Dhenuka','Natakapriya','Kokilapriya','Rupavati',
    'Gayakapriya','Vakulabharanam','Mayamalavagowla','Chakravakam','Suryakantam','Hatakambari',
    'Jhankaradhvani','Natabhairavi','Kiravani','Kharaharapriya','Gourimanohari','Varunapriya',
    'Mararanjani','Charukesi','Sarasangi','Harikambhoji','Dheerasankarabharanam','Naganandini',
    'Yagapriya','Ragavardhini','Gangeyabhushani','Vagadeeshwari','Shulini','Chalanata',
    'Salagam','Jalarnavam','Jhalavarali','Navaneetam','Pavani','Raghupriya',
    'Gavambodhi','Bhavapriya','Subhapanthuvarali','Shadvidamargini','Suvarnangi','Divyamani',
    'Dhavalambari','Namanarayani','Kamavardhini','Ramapriya','Gamanashrama','Vishwambari',
    'Shyamalaangi','Shanmukhapriya','Simhendramadhyamam','Hemavati','Dharmavati','Neetimati',
    'Kantamani','Rishabhapriya','Latangi','Vachaspati','Mechakalyani','Chitrambari',
    'Sucharitra','Jyotiswarupini','Dhatuvardhani','Nasikabhushani','Kosalam','Rasikapriya',
  ];
  return {
    id: `mela-${p.mela}`,
    name: MELAKARTA_NAMES[p.mela - 1] || `Melakarta ${p.mela}`,
    mela: p.mela,
    arohana,
    avarohana,
  } as RagaDef;
});

// A small curated set of popular Janya (derived) ragas with parent melakarta info in comments
export const JANYA_RAGAS: RagaDef[] = [
  {
    id: 'abhogi',
    name: 'Abhogi',
    mela: 22, // Kharaharapriya
    arohana: ['S','R2','G2','M1','D2','S'],
    avarohana: ['S','D2','M1','G2','R2','S'],
  },
  {
    id: 'abheri',
    name: 'Abheri',
    mela: 22,
    arohana: ['S','G2','M1','P','N2','S'],
    avarohana: ['S','N2','D2','P','M1','G2','R2','S'],
  },
  {
    id: 'mohanam',
    name: 'Mohanam',
    mela: 28, // Harikambhoji janya (also 29 scale-wise)
    arohana: ['S','R2','G3','P','D2','S'],
    avarohana: ['S','D2','P','G3','R2','S'],
  },
  {
    id: 'hamsadhwani',
    name: 'Hamsadhwani',
    mela: 29, // Sankarabharanam
    arohana: ['S','R2','G3','P','N3','S'],
    avarohana: ['S','N3','P','G3','R2','S'],
  },
  {
    id: 'hindolam',
    name: 'Hindolam',
    mela: 20, // Natabhairavi
    arohana: ['S','G2','M1','D1','N2','S'],
    avarohana: ['S','N2','D1','M1','G2','S'],
  },
  {
    id: 'shuddha-saveri',
    name: 'Shuddha Saveri',
    mela: 29,
    arohana: ['S','R2','M1','P','D2','S'],
    avarohana: ['S','D2','P','M1','R2','S'],
  },
  {
    id: 'kambhoji',
    name: 'Kambhoji',
    mela: 28,
    arohana: ['S','R2','G3','M1','P','D2','S'],
    avarohana: ['S','N2','D2','P','M1','G3','R2','S'],
  },
  {
    id: 'bilahari',
    name: 'Bilahari',
    mela: 29,
    arohana: ['S','R2','G3','P','D2','S'],
    avarohana: ['S','N3','D2','P','M1','G3','R2','S'],
  },
  {
    id: 'madhyamavathi',
    name: 'Madhyamavathi',
    mela: 22,
    arohana: ['S','R2','M1','P','N2','S'],
    avarohana: ['S','N2','P','M1','R2','S'],
  },
  {
    id: 'sriranjani',
    name: 'Sriranjani',
    mela: 22,
    arohana: ['S','R2','G2','M1','D2','S'],
    avarohana: ['S','D2','M1','G2','R2','S'],
  },
  {
    id: 'arabhi',
    name: 'Arabhi',
    mela: 29,
    arohana: ['S','R2','M1','P','D2','S'],
    avarohana: ['S','N2','D2','P','M1','R2','S'],
  },
  {
    id: 'kedaragowla',
    name: 'Kedaragowla',
    mela: 29,
    arohana: ['S','M1','G3','M1','P','N2','S'],
    avarohana: ['S','N2','D2','P','M1','G3','R2','S'],
  },
  {
    id: 'reetigowla',
    name: 'Reetigowla',
    mela: 22,
    arohana: ['S','R2','G2','M1','N2','D2','N2','S'],
    avarohana: ['S','N2','D2','M1','G2','R2','S'],
  },
  {
    id: 'sahana',
    name: 'Sahana',
    mela: 28,
    arohana: ['S','R2','G3','M1','P','M1','D2','N2','S'],
    avarohana: ['S','N2','D2','P','M1','G3','R2','S'],
  },
  {
    id: 'pantuvarali',
    name: 'Pantuvarali',
    mela: 51,
    arohana: ['S','R1','G3','M2','P','D1','N3','S'],
    avarohana: ['S','N3','D1','P','M2','G3','R1','S'],
  },
  {
    id: 'yamunakalyani',
    name: 'Yamunakalyani',
    mela: 65,
    arohana: ['S','R2','G3','P','D2','S'],
    avarohana: ['S','N3','D2','P','M2','G3','R2','S'],
  },
  {
    id: 'lalitha',
    name: 'Lalitha',
    mela: 15, // Mayamalavagowla
    arohana: ['S','R1','G3','M1','D1','N3','S'],
    avarohana: ['S','N3','D1','M1','G3','R1','S'],
  },
];

// Popular raga set (cross-cuts melakarta and janya)
export const POPULAR_RAGA_IDS: string[] = [
  'mela-15','mela-22','mela-28','mela-29','mela-57','mela-65',
  'abhogi','abheri','mohanam','hamsadhwani','hindolam','shuddha-saveri',
  'kambhoji','bilahari','madhyamavathi','sriranjani','arabhi','kedaragowla','reetigowla','sahana','pantuvarali','yamunakalyani','lalitha',
];

const RAGA_LOOKUP: Record<string, RagaDef> = [...RAGAS, ...JANYA_RAGAS].reduce((acc, r) => { acc[r.id] = r; return acc; }, {} as Record<string, RagaDef>);
export const POPULAR_RAGAS: RagaDef[] = POPULAR_RAGA_IDS.map((id) => RAGA_LOOKUP[id]).filter(Boolean);

export function computeRagaNoteSet(tonic: ScaleKey, raga: RagaDef): string[] {
  // Return unique note names across S4..S5 for highlights
  const set = new Set<string>();
  const collect = (seq: Swara[]) => {
    seq.forEach((sw) => {
      const off = SWARA_OFFSETS[sw];
      set.add(noteNameFor(tonic, off, 4));
      set.add(noteNameFor(tonic, off, 5));
    });
  };
  collect(raga.arohana);
  collect(raga.avarohana);
  return Array.from(set);
}

let abortToken: { aborted: boolean } | null = null;

export function stopRagaPlayback(): void {
  if (abortToken) abortToken.aborted = true;
  audioPlayer.stop();
}

export async function playRagaSequence(args: {
  raga: RagaDef;
  tonic: ScaleKey;
  direction: 'arohana' | 'avarohana' | 'both';
  bpm: number;
  baseUrl: (noteName: string) => string;
  onNoteStart?: (noteName: string) => void;
  onNoteEnd?: (noteName: string) => void;
}): Promise<void> {
  const { raga, tonic, direction, bpm, baseUrl } = args;
  const msPerBeat = Math.max(150, Math.floor(60000 / Math.max(1, bpm)));
  abortToken = { aborted: false };

  const toNotes = (swaras: Swara[], startOct: number, mode: 'asc' | 'desc'): string[] => {
    return swaras.map((sw, idx, arr) => {
      // For ascending: render the last 'S' (top Sa) in the next octave
      if (mode === 'asc' && sw === 'S' && idx === arr.length - 1) {
        return noteNameFor(tonic, SWARA_OFFSETS[sw], startOct + 1);
      }
      // For descending: if the first is 'S', treat as top Sa (startOct)
      return noteNameFor(tonic, SWARA_OFFSETS[sw], startOct);
    });
  };

  // Build sequence from S4 to S5 endpoints
  let ascend = toNotes(raga.arohana, 4, 'asc');

  let sequence: string[] = [];
  if (direction === 'arohana') {
    sequence = ascend;
  } else if (direction === 'avarohana') {
    const descend = [...toNotes(raga.avarohana, 5, 'desc')].reverse();
    sequence = descend;
  } else {
    const descend = [...ascend].slice(0, -1).reverse();
    sequence = [...ascend, ...descend];
  }

  for (const note of sequence) {
    if (abortToken.aborted) break;
    try {
      args.onNoteStart?.(note);
      const url = baseUrl(note);
      await audioPlayer.play(url);
      await new Promise((r) => setTimeout(r, msPerBeat));
      args.onNoteEnd?.(note);
    } catch {}
  }
  audioPlayer.stop();
}


