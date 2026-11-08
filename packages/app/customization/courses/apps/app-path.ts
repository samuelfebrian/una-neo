/**
 * Path form of a UNA URL for client-side navigation.
 *
 * UNA generates absolute request URLs (`http://labs.genply.com/view-...`) in
 * block links. `router.push()` treats an absolute URL as an external target and
 * falls back to a full document load; reducing it to its path keeps the
 * navigation inside Next's client router (only the page data is fetched).
 */
const ABSOLUTE = /^(?:[a-z][a-z0-9+.-]*:)?\/\/[^/]+/i;

export function appPath(url: string | undefined | null): string {
    const value = String(url ?? '').trim();
    if (!value) return '';
    if (ABSOLUTE.test(value)) return value.replace(ABSOLUTE, '') || '/';
    return value.startsWith('/') ? value : `/${value}`;
}