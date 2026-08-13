# HanLearn deployment on WSL + Cloudflare

Production currently serves one public origin through `learn.featai.tech`:

`Cloudflare Tunnel (WSL) → Nginx proxy (Docker :80) → Web / API`

The production web build uses `VITE_API_URL=/api/v1`, so public browsers call
the API through the same hostname instead of trying to reach `localhost`.

The checked-in files are templates. Keep the real production environment file,
Cloudflare credentials, and tunnel config outside git.

Ubuntu currently keeps `Ubuntu-24.04` for the tunnel service and
`docker-desktop` because Docker Desktop requires it. No other WSL distro or
`feat-ai` tunnel remains on this machine.

Windows Startup runs the user-level `HanLearn-WSL-Tunnel.vbs` keepalive so the
Ubuntu tunnel remains available after the last terminal is closed.
