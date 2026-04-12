# Runbooks

## Overview

Runbooks are operational guides for common tasks, troubleshooting, and incident response. They provide step-by-step instructions to ensure consistency and reduce time to resolution.

## Quick Reference

| Runbook | Purpose | Time to Complete |
|---------|---------|-----------------|
| [01 - Quick Start](./01-quick-start.md) | Initial project setup | 15 minutes |
| [02 - Debugging](./02-debugging.md) | Common issues & solutions | Varies |

## When to Use Runbooks

**Use runbooks when:**
- Setting up the project for the first time
- Encountering errors or issues
- Performing routine maintenance
- Responding to incidents
- Onboarding new team members

**Don't use runbooks for:**
- Learning the codebase (see docs/ instead)
- Architecture decisions (see ADRs)
- Feature development (see development guides)

## Creating New Runbooks

### Naming Convention

- Format: `##-short-descriptive-name.md`
- Use two-digit prefix for ordering
- Use kebab-case for file names

Example: `03-database-migration.md`, `04-security-incident.md`

### Template

```markdown
# Runbook Title

## Overview
Brief description of what this runbook covers.

## Prerequisites
- List required access/permissions
- List required tools
- List required knowledge

## Steps

### Step 1: Title
Detailed instructions.

```bash
# Example command
```

### Step 2: Title
More instructions.

## Verification
How to verify the runbook was completed successfully.

## Troubleshooting

### Issue: Description
Solution steps.

## Related
- Link to other runbooks
- Link to documentation
- Link to monitoring dashboards
```

## Runbook Categories

### Setup & Configuration
- Environment setup
- Initial configuration
- Service installation

### Operations
- Regular maintenance tasks
- Backup and restore
- Scaling procedures

### Troubleshooting
- Common errors
- Debugging guides
- Performance issues

### Incident Response
- Security incidents
- Outage response
- Rollback procedures

## Maintenance

Runbooks should be:
- **Tested**: Verified to work as written
- **Updated**: Reviewed quarterly
- **Accurate**: Reflect current state of systems
- **Discoverable**: Linked from relevant places

### Review Schedule

| Runbook | Last Review | Next Review | Owner |
|---------|-------------|-------------|-------|
| 01-quick-start | Auto | On changes | Team |
| 02-debugging | Auto | On changes | Team |

## Contributing

To add or update a runbook:

1. Create new file in `/runbooks/`
2. Follow naming convention and template
3. Test all commands and steps
4. Update this index
5. Submit PR with runbook label

## Feedback

If a runbook is unclear or incorrect:
- Open an issue with label `documentation`
- Reference the specific runbook
- Describe what went wrong or what was confusing

## External Resources

- [Google SRE Runbooks](https://sre.google/sre-book/monitoring-distributed-systems/)
- [AWS Operational Excellence](https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/welcome.html)
- [PagerDuty Incident Response](https://response.pagerduty.com/)
