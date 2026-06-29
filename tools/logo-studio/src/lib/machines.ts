// Machine Tracker — a presence board for the editing workstations (named after
// Firefly characters). It does NOT log in/out of the actual machines; it just
// shows the team who is sitting at which computer.

export interface Machine {
  id: string;
  name: string; // Firefly character / hostname
  role: string; // character flavor
  bio: string; // longer character blurb for the Characters page
  kind: "PC" | "Mac";
  cpu: string;
  ram: string;
  gpu: string;
}

export const MACHINES: Machine[] = [
  { id: "kaylee", name: "Kaylee", role: "Ship's mechanic — keeps everything running", bio: "The heart of the engine room: endlessly upbeat and able to coax performance out of any rig. A natural fit for our fast, do-everything workstation.", kind: "PC", cpu: "Intel i9-14900F", ram: "64 GB (4800 MT/s)", gpu: "RTX 4080 SUPER (16 GB)" },
  { id: "inara", name: "Inara", role: "Companion — poised and powerful", bio: "Refined, composed, and quietly the most capable in the room. Paired with the big-VRAM workhorse for heavy timelines and effects.", kind: "PC", cpu: "AMD Ryzen 9 5950X (16-core)", ram: "64 GB (3200 MT/s)", gpu: "RTX 3090 (24 GB)" },
  { id: "wash", name: "Wash", role: "Pilot — fast and nimble", bio: "Quick, playful, and unflappable at the controls. Matched to the nimble machine with our newest GPU for snappy, responsive edits.", kind: "PC", cpu: "AMD Ryzen 9 9900X (12-core)", ram: "32 GB (4800 MT/s)", gpu: "RTX 5080 (16 GB) + Radeon iGPU" },
  { id: "river", name: "River", role: "The prodigy — quietly brilliant", bio: "Brilliant and a little mysterious, seeing patterns no one else can. One of our two Apple-silicon powerhouses for buttery playback.", kind: "Mac", cpu: "Apple M2 Ultra", ram: "64 GB unified", gpu: "M2 Ultra (integrated)" },
  { id: "shepherd", name: "Shepherd", role: "The steady hand — calm and wise", bio: "Grounded, wise, and the calm in any storm. Our other M2 Ultra machine — dependable for long, focused sessions.", kind: "Mac", cpu: "Apple M2 Ultra", ram: "64 GB unified", gpu: "M2 Ultra (integrated)" },
];

/** Repo path for a character portrait (upload these to light up the page). */
export function characterImagePath(id: string): string { return `Machines/characters/${id}.jpg`; }

export interface Session { name: string; start: string; end: string }
export interface Occupant { name: string; email?: string; since: string; warnedAt?: string }
export interface MachineStatus { current: Occupant | null; history: Session[] }
export interface BoardState { machines: Record<string, MachineStatus> }

const HISTORY_LIMIT = 25;

export function emptyStatus(): MachineStatus { return { current: null, history: [] }; }

export function getStatus(board: BoardState, id: string): MachineStatus {
  return board.machines[id] || emptyStatus();
}

/** Sign an editor onto a machine. If someone else is on it, their session is
 *  closed into history first (takeover). */
export function claim(status: MachineStatus, who: { name: string; email?: string }, now: string): MachineStatus {
  const history = [...status.history];
  if (status.current) {
    if ((who.email && status.current.email === who.email) || status.current.name === who.name) return status; // already on it
    history.unshift({ name: status.current.name, start: status.current.since, end: now });
  }
  return { current: { name: who.name, email: who.email, since: now }, history: history.slice(0, HISTORY_LIMIT) };
}

/** Sign off a machine, recording the session in history. */
export function release(status: MachineStatus, now: string): MachineStatus {
  if (!status.current) return status;
  const history = [{ name: status.current.name, start: status.current.since, end: now }, ...status.history];
  return { current: null, history: history.slice(0, HISTORY_LIMIT) };
}
