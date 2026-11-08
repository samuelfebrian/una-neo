/**
 * The landing on the editor page after UNA's own post-publish redirect counts as
 * "just published" only right after the redirect — within this window the lesson
 * editor auto-opens for the landed node. Saves surprises on later manual visits.
 */
const LANDING_WINDOW_MS = 12 * 60_000;

export function arrivedWithinLandingWindow(): boolean {
    const marker = Number(sessionStorage.getItem('neo_step_back') ? JSON.parse(sessionStorage.getItem('neo_step_back') || '{}')?.at ?? 0 : 0);
    return marker > 0 && Date.now() - marker < LANDING_WINDOW_MS;
}
