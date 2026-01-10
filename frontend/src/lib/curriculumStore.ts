import { defaultCurriculumPrograms, type CurriculumProgram } from "@/data/curriculumPrograms";

const STORAGE_KEY = "unireg.curriculumPrograms.v1";

export function loadCurriculumPrograms(): CurriculumProgram[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultCurriculumPrograms;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return defaultCurriculumPrograms;
    // minimal shape check
    return parsed.filter(Boolean) as CurriculumProgram[];
  } catch {
    return defaultCurriculumPrograms;
  }
}

export function saveCurriculumPrograms(programs: CurriculumProgram[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(programs));
}

export function resetCurriculumPrograms() {
  localStorage.removeItem(STORAGE_KEY);
}

export function listSystems(programs: CurriculumProgram[]) {
  return Array.from(new Set(programs.map((p) => p.system)));
}

export function listCohorts(programs: CurriculumProgram[], system?: CurriculumProgram["system"]) {
  const filtered = system ? programs.filter((p) => p.system === system) : programs;
  return Array.from(new Set(filtered.map((p) => p.cohort))).sort();
}

export function listMajors(
  programs: CurriculumProgram[],
  system?: CurriculumProgram["system"],
  cohort?: string,
): Array<{ major: string; majorLabel: string }> {
  const filtered = programs.filter((p) => (!system || p.system === system) && (!cohort || p.cohort === cohort));
  const map = new Map<string, string>();
  filtered.forEach((p) => map.set(p.major, p.majorLabel));
  return Array.from(map.entries())
    .map(([major, majorLabel]) => ({ major, majorLabel }))
    .sort((a, b) => a.majorLabel.localeCompare(b.majorLabel));
}

export function findProgram(
  programs: CurriculumProgram[],
  system?: CurriculumProgram["system"],
  cohort?: string,
  major?: string,
) {
  if (!system || !cohort || !major) return undefined;
  return programs.find((p) => p.system === system && p.cohort === cohort && p.major === major);
}


