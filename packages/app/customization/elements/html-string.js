/**
 * UNA page blocks whose service returns a bare HTML string (e.g.
 * `bx_videos:entity_context` = the "Posted in" author unit) reach the client
 * with `content` as a raw string and no `type`, so `blockContentItems` yields
 * one string item. JSX can't spread a string, so props come in polluted with
 * per-character keys — read the HTML from `blockWrapperProps` (the real block)
 * instead of trusting `data`.
 */
import Html from 'app/ui/atoms/html';

export default function ElementHtmlString({ blockWrapperProps, data }) {
    const fromBlock = blockWrapperProps?.block?.content;
    const html = typeof data === 'string' ? data : typeof fromBlock === 'string' ? fromBlock : data?.content ?? fromBlock?.content ?? '';
    return <Html data={html} />;
}
