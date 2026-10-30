'use strict';
// Read-only proof of the native Elementary profile selected by the owner.
// A later profile write invalidates this proof instead of displaying stale data.
var fs = require('fs'), crypto = require('crypto');
function read() {
    try {
        var p = JSON.parse(fs.readFileSync('/opt/vetro-boot/ui-performance.json', 'utf8'));
        var profile = '/home/owner/share/.elementary/config/tv/base.cfg';
        var digest = crypto.createHash('sha256').update(fs.readFileSync(profile)).digest('hex');
        var confirmed = p.version === 1 && p.profile === profile && digest === p.profileSha256;
        return {animationFactor: confirmed ? p.transitionDurationFactor : null,
            profileConfirmed: confirmed, speedupVerified: false,
            note: confirmed ? 'Factor saved in the TV profile. Testing did not establish a noticeable responsiveness improvement.' :
                'Profile changed since the last check; read the factor again.'};
    } catch (e) {
        return {animationFactor: null, profileConfirmed: false, speedupVerified: false, error: e.message};
    }
}
module.exports = {read: read};
