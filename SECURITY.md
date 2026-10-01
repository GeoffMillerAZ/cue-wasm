# Security

Treat CUE sources, virtual paths and returned diagnostics as untrusted application
input. Escape diagnostic text in the host UI. Do not embed credentials in sources,
asset URLs or routine logs. Evaluation cannot authorize actions or establish truth.

Use dedicated workers with bounded inputs, queues and deadlines for browser tools.
Active cancellation/disposal terminates the owner. These limits are not a hard heap
quota; hostile evaluation can allocate memory before its deadline. Browser origin/CSP,
Go host shims, builtins and module resolution are separate security boundaries.

The legacy direct Node/browser loader does not have worker cancellation or isolation.
A filesystem import refusal test is a narrow regression, not proof of a complete
sandbox. Do not execute arbitrary untrusted source in a privileged native process.

Supplied virtual files use validated identities and explicit entry points. Remote
module resolution is disabled, including ambient registry settings. Browser loaders
reserve one overlay mount and do not grant Node filesystem access. This does not
turn native CUE load overlays into hermetic filesystems; see ADR-0003.

No new security-support certification is implied by this local uplift. The current
tracker records verified behavior and unfinished audit work. For a suspected defect,
use GitHub private vulnerability reporting if enabled; otherwise contact the repository
owner privately through an established channel. Do not post secrets or an exploit
against a live deployment in public issues. No placeholder reporting address is valid.
