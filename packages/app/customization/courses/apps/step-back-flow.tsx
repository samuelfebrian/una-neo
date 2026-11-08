/**
 * Route back to the lesson that opened a step creation page.
 *
 * The outline editor stores the return URL (sessionStorage `neo_step_back`)
 * before it sends the browser to UNA's own create page (create-video etc.).
 * UNA's own form publishes there and, by UNA's api behaviour, stays on the
 * same page. This component polls UNA for the lesson steps; once UNA's
 * on_content_added attach lands (step count grows past the stored baseline)
 * it routes back to the stored lesson view and clears the flow.
 *
 * Mounted in the footer wrapper, so it only needs to exist once.
 */
import { useEffect, useRef } from 'react';
import { coursesApi } from 'app/customization/courses/api';

const FLOW_KEY = 'neo_step_back';
const FLOW_MAX_AGE_MS = 12 * 60 * 1000;
const POLL_INTERVAL_MS = 2500;
const POLL_MAX_TRIES = 40;

function StepBackFlow() {
    const tries = useRef(0);
    const timer = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const start = () => {
            try {
                const raw = sessionStorage.getItem(FLOW_KEY);
                if (!raw) return;
                const flow = JSON.parse(raw);
                if (!flow?.nid || !flow?.courseId || !flow?.url || Date.now() - (flow.at || 0) > FLOW_MAX_AGE_MS) {
                    sessionStorage.removeItem(FLOW_KEY);
                    return;
                }
                // UNA's form redirects back to the editor page with the lesson node
                // as `parent_id` — that landing proves the submit. `mode` decides
                // how: `add` polls UNA until the attach is in (step grows), `edit`
                // routes straight back to the lesson (no count change).
                const params = new URLSearchParams(window.location.search);
                const ctxNid = Number(params.get('context_nid') ?? params.get('parent_id') ?? 0);
                if (flow.nid !== ctxNid) return;
                if (flow.mode === 'edit') {
                    sessionStorage.removeItem(FLOW_KEY);
                    if (timer.current) {
                        clearInterval(timer.current);
                        timer.current = null;
                    }
                    window.location.assign(flow.url);
                    return;
                }
                if (timer.current) return;
                timer.current = setInterval(async () => {
                    tries.current += 1;
                    if (tries.current > POLL_MAX_TRIES) {
                        clearInterval(timer.current!);
                        timer.current = null;
                        sessionStorage.removeItem(FLOW_KEY);
                        return;
                    }
                    try {
                        const node = await coursesApi.nodeBlock(flow.courseId, flow.nid);
                        if ((node?.steps?.length ?? 0) > (flow.steps ?? 0)) {
                            clearInterval(timer.current!);
                            timer.current = null;
                            sessionStorage.removeItem(FLOW_KEY);
                            window.location.assign(flow.url);
                        }
                    } catch {
                        // keep polling until the cap; UNA may be busy
                    }
                }, POLL_INTERVAL_MS);
            } catch {
                // malformed flow — ignore
            }
        };
        start();
        return () => {
            if (timer.current) {
                clearInterval(timer.current);
                timer.current = null;
            }
        };
    }, []);

    return null;
}

export default StepBackFlow;
