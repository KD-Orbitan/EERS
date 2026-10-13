# Documentation

Start with the [project README](../README.md) to run the English portfolio demo.

## Product and engineering references

| Document | Purpose |
| --- | --- |
| [Portfolio guide](PORTFOLIO.md) | Architecture overview, demo walkthrough, and CV wording |
| [API application](../apps/api/README.md) | Backend structure and verification commands |
| [Web application](../apps/web/README.md) | Frontend structure and verification commands |
| [Technical decisions](DECISIONS.md) | Project design decisions and constraints |
| [Schema](SCHEMA.md) | Data model reference; compare with the [Prisma schema](../apps/api/prisma/schema.prisma) when changing persistence |
| [API](API.md) | API specification; the running backend also exposes generated documentation at `/docs` |
| [Workflows](WORKFLOWS.md) | Intended business workflows |
| [Reference](REFERENCE.md) | Naming, codes, and shared conventions |
| [Google authentication](GOOGLE-AUTH.md) | OAuth setup |
| [Notifications](NOTIFICATION-BEHAVIOR.md) | Notification behavior |
| [Contributing](../CONTRIBUTING.md) | Repository organization and what belongs in Git |

Specifications describe intended behavior and are not proof that every requirement has been implemented. Update the relevant reference together with a behavior change and verify against source and tests.

## Development plans and historical context

These documents remain at their existing paths because project instructions refer to them. They are not the entry point for running the portfolio demo.

- [API playbook](PLAYBOOK-API.md) and [web playbook](PLAYBOOK-WEB.md): implementation sequencing and development guidance.
- [Architecture review](CLEAN-ARCHITECTURE-REVIEW.md): findings and scope of a previous review, not a current whole-project certification.
- [Original admin demo data](ADMIN-DEMO-DATA.md): original dataset guidance. Use the root README's portfolio commands for the English demo.

Local prompt drafts, phase instructions, assistant settings, and scratch output are excluded from the published source tree. Reusable project instructions in `CLAUDE.md` remain versioned.
