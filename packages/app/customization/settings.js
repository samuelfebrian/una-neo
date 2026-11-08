import { settingsDefault } from 'app/default/settings';

// DON'T EDIT THIS FILE IN MAIN REPO!!!
// only for custom projects change some specific settings here if needed

// Web uploads: always go through the same-origin `/api/api.php` proxy.
// `-1` disables NEO's "direct upload to UNA" path (`shouldUploadDirect` never passes):
// on labs.genply.com `/api.php` is routed to the NEO tunnel, so a direct POST never
// reaches UNA (404 → parsed as a bogus result → "[files] upload returned no ghost").
// The proxy streams multipart bodies fine and UNA front ends accept 1024M now
// (upload_max_filesize / post_max_size / nginx client_max_body_size).
export const settings = Object.assign(settingsDefault, {
    direct_upload_over_mb: -1,
});
