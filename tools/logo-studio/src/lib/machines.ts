// Machine Tracker — a presence board for the editing workstations (named after
// Firefly characters). It does NOT log in/out of the actual machines; it just
// shows the team who is sitting at which computer.

export interface Machine {
  id: string;
  name: string; // Firefly character / hostname
  role: string; // character flavor
  kind: "PC" | "Mac";
  cpu: string;
  ram: string;
  gpu: string;
}

export const MACHINES: Machine[] = [
  { id: "kaylee", name: "Kaylee", role: "Ship's mechanic — keeps everything running", kind: "PC", cpu: "Intel i9-14900F", ram: "64 GB (4800 MT/s)", gpu: "RTX 4080 SUPER (16 GB)" },
  { id: "inara", name: "Inara", role: "Companion — poised and powerful", kind: "PC", cpu: "AMD Ryzen 9 5950X (16-core)", ram: "64 GB (3200 MT/s)", gpu: "RTX 3090 (24 GB)" },
  { id: "wash", name: "Wash", role: "Pilot — fast and nimble", kind: "PC", cpu: "AMD Ryzen 9 9900X (12-core)", ram: "32 GB (4800 MT/s)", gpu: "RTX 5080 (16 GB) + Radeon iGPU" },
  { id: "river", name: "River", role: "The genius — quietly brilliant", kind: "Mac", cpu: "Apple M2 Ultra", ram: "64 GB unified", gpu: "M2 Ultra (integrated)" },
  { id: "shepherd", name: "Shepherd", role: "Shepherd Book — steady and wise", kind: "Mac", cpu: "Apple M2 Ultra", ram: "64 GB unified", gpu: "M2 Ultra (integrated)" },
];

export interface Session { name: string; start: string; end: string }
export interface MachineStatus { current: { name: string; since: string } | null; history: Session[] }
export interface BoardState { machines: Record<string, MachineStatus> }

const HISTORY_LIMIT = 25;

export function emptyStatus(): MachineStatus { return { current: null, history: [] }; }

export function getStatus(board: BoardState, id: string): MachineStatus {
  return board.machines[id] || emptyStatus();
}

/** Sign an editor onto a machine. If someone else is on it, their session is
 *  closed into history first (takeover). */
export function claim(status: MachineStatus, name: string, now: string): MachineStatus {
  const history = [...status.history];
  if (status.current) {
    if (status.current.name === name) return status; // already on it
    history.unshift({ name: status.current.name, start: status.current.since, end: now });
  }
  return { current: { name, since: now }, history: history.slice(0, HISTORY_LIMIT) };
}

/** Sign off a machine, recording the session in history. */
export function release(status: MachineStatus, now: string): MachineStatus {
  if (!status.current) return status;
  const history = [{ name: status.current.name, start: status.current.since, end: now }, ...status.history];
  return { current: null, history: history.slice(0, HISTORY_LIMIT) };
}
