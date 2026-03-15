# Legal Compliance Checklist

Last updated: `2026-03-16`

This checklist covers the legal and operational items that cannot be fully enforced by frontend/backend code alone.

## Payment And Tax

- Confirm that the current Robokassa merchant setup for the seller status actually issues the required payment receipt / tax document for each successful payment.
- Verify the live receipt delivery flow end-to-end:
  - successful payment
  - receipt generated
  - receipt accessible or sent to the customer where required
- Re-check that the seller still qualifies for the declared tax regime (`самозанятый / НПД`) under current turnover and operating model.

## Personal Data

- Verify whether a current operator notification / registration is required for the actual data processing model and hosting setup.
- Re-check whether the enabled external analytics stack implies cross-border transfer obligations in the current deployment.
- Keep the public privacy policy aligned with the real list of enabled services:
  - GA / GTM
  - Yandex Metrica
  - PostHog
  - Sentry
  - TikTok Pixel
  - Robokassa

## Asset Rights

- Keep an archive proving the origin and allowed use of every shipped media asset.
- Preserve the current evidence for:
  - generated gem / sprite images
  - background music attribution and license
- If any asset is replaced with a third-party source, attach the license / purchase / permission record before deploy.

## Release Gate

Before each production release, verify:

- consent banner is shown to users who have not made a privacy choice yet
- optional analytics / marketing scripts do not initialize before consent
- legal links on the landing page and in-game legal modal open the current HTML documents
- seller contacts and tax details are still current
