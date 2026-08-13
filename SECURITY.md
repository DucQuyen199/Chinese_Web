# Security Policy

HanLearn is an open-source project and welcomes responsible security research. This document explains how to report a vulnerability without exposing learners, maintainers, or other users to unnecessary risk.

## Supported versions

| Version or branch | Security support |
| --- | --- |
| `main` | Best-effort security fixes during active development |
| Older commits and unofficial forks | No guaranteed support |

The project is currently an active MVP and may not be suitable for processing real learner data without additional hardening.

## Reporting a vulnerability

Please do not open a public GitHub issue for an unpatched vulnerability.

Preferred method:

1. Use GitHub's private vulnerability reporting feature from the repository's **Security** tab, when available.
2. If private reporting is unavailable, contact the repository owner `DucQuyen199` privately through GitHub.

Please include:

- A concise description and severity assessment.
- The affected version, commit, service, route, or file.
- Clear reproduction steps and a minimal proof of concept where safe.
- The security impact, required privileges, and possible attack path.
- Redacted logs, screenshots, or request/response examples.
- A suggested mitigation, if you have one.

Never include passwords, access tokens, private keys, database dumps, real learner records, or other personal data in a report. If sensitive data has already been exposed, state that clearly and stop further testing.

## What to expect

Maintainers will make a reasonable effort to:

- Acknowledge a private report within 7 calendar days.
- Confirm whether the issue is reproducible and assess its impact.
- Keep the reporter informed while a fix or mitigation is prepared.
- Coordinate disclosure timing after affected users have a reasonable opportunity to update.
- Credit the reporter in an advisory when the reporter agrees.

Response and remediation times depend on severity, reproducibility, maintainer availability, and whether a dependency or hosting provider must also release a fix.

## Scope

Please report issues involving:

- Authentication, session handling, JWTs, cookies, or password processing.
- Authorization, role checks, tenant/data isolation, or privilege escalation.
- API validation, injection, unsafe database access, or sensitive-data exposure.
- File upload, media serving, path traversal, or server-side code execution.
- Secret leakage, insecure configuration, or production deployment weaknesses.
- Vulnerable dependencies when there is a practical impact on this application.

The following are generally out of scope unless they demonstrate a concrete security impact:

- Social engineering, phishing, spam, or physical attacks.
- Denial-of-service testing, traffic flooding, or disruption of shared services.
- Issues in third-party services that are not controlled by this project.
- Reports based only on outdated software versions without a working exploit.
- Missing hardening recommendations without an exploitable vulnerability.

Do not access, modify, delete, or retain data that does not belong to you. Do not test against a public deployment without explicit authorization.

## Safe-harbor expectations

Good-faith research is welcome when it:

- Avoids privacy violations, service disruption, and data destruction.
- Uses only accounts and data owned by the researcher or explicitly provided for testing.
- Stops testing and reports promptly after confirming an issue.
- Does not publicly disclose the vulnerability before coordinated remediation.

This policy does not grant permission to test infrastructure that the project does not own or operate.

## Secret exposure

If you accidentally commit or disclose a secret:

1. Do not paste the secret into an issue or pull request.
2. Revoke or rotate it immediately.
3. Remove it from future commits, while remembering that Git history may still contain it.
4. Report the exposure privately so maintainers can assess impact and affected deployments.

## Legal notice

This policy is not a warranty or a guarantee of response. The project is provided under the [Apache License 2.0](LICENSE), including its warranty disclaimer and limitation of liability.
