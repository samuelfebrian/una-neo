/**
 * UNA content URLs → UNA edit page URLs. UNA's own entry menus link the edit
 * pages (`edit-video`, `edit-class`, `edit-post`, `edit-poll`, `edit-file`); the
 * step pencil opens the same UNA edit page for the step's content.
 */
const EDIT_PATH_MAP: Record<string, string> = {
    '/view-video': '/edit-video',
    '/video': '/edit-video',
    '/class': '/edit-class',
    '/classes': '/edit-class',
    '/posts': '/edit-post',
    '/post': '/edit-post',
    '/poll': '/edit-poll',
    '/file': '/edit-file'
};

export function contentEditPath(stepLink = ''): string | null {
    try {
        const url = stepLink.startsWith('http') ? new URL(stepLink) : new URL(stepLink, 'https://lms.local');
        const first = '/' + (url.pathname.split('/')[1] || '');
        const editPath = EDIT_PATH_MAP[first];
        if (editPath) return url.pathname.replace(first, editPath);
    } catch {
        // fall through: relative/odd link
    }
    return null;
}
