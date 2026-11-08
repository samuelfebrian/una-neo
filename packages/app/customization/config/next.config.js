// Fork-level Next config add-ons (deep-merged into apps/next/next.config.js).
//
// `experimental.proxyClientMaxBodySize`: NEO's same-origin proxy streams course
// media uploads through the proxy/middleware; with Next 16's default 10 MB cap
// anything larger is truncated and UNA's uploader uploads half a body or dies
// with a socket hang up ("Oops! ... no file to upload" / Submit doing nothing).
// UNA's PHP front ends accept 1024M now, so the proxy must too. The old key
// `middlewareClientMaxBodySize` is deprecated in this Next version.
const nextConfigCustom = {
    experimental: {
        proxyClientMaxBodySize: 1024 * 1024 * 1024
    }
};
module.exports = nextConfigCustom;
