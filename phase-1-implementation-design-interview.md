# Phase 1 design interview

Reusable prompt for walking the Phase 1 design tree until decisions are shared and documented for **confiance chatbot** (fiat-on-ramp escrow, not voting).

## Quick copy

Paste this into a new chat:

```
Interview me relentlessly about every aspect of Holdam Phase 1 (current live MVP) until we reach a shared understanding.

Walk down each branch of the design tree, resolving dependencies between decisions one by one.

Update the documentation as we go. Create new docs in docs/system-design/phase-1/ when a topic needs its own spec.

Read first (in order):
1. docs/README.md
2. docs/system-design/README.md
3. docs/system-design/phase-1/trust-model.md
4. docs/system-design/phase-1/escrow-lifecycle.md
5. docs/domain-model.md and docs/domain-glossary.md
6. docs/system-design/phase-1/phase-1-mvp.md
7. Every file in docs/system-design/phase-1/
8. docs/open-questions.md

Use this dependency order when choosing what to decide next:
1. Trust boundaries and security invariants (Zone 1/2/3, pool-only disputes, Model 4 timeline)
2. Money flow (Paystack → reserve → Escrow.sol → payout provider → seller bank)
3. Smart contracts (EscrowFactory, Escrow clone, ArbitrationPool, deployment invariants)
4. Domain model and business invariants (escrow, checkout_deals, milestones, disputes)
5. Wallet and auth (KDF v1, JWT, OTP on critical actions, three auth domains)
6. escrow-service API modules and data flows (consumer vs SDK/checkout paths)
7. arbitration-service integration (sync, commit-reveal, execute, no EOA release)
8. Reserve, circuit breaker, and proof-of-reserves
9. Compliance and KYC tiers
10. Client surfaces (escrow-ui, checkout-ui, merchant-ui, control-ui, arbitration-ui)
11. Background jobs and event indexer
12. Verifiability APIs and honest product copy
13. BDD alignment (docs/tests/acceptance-criteria/)
14. Exit criteria (PoC metrics) and open questions
15. Explicit deferrals to Phase 2/3 (do not blur live vs roadmap)

At each decision:
- State what is being decided and what it depends on
- Ask one focused question at a time; push back if an answer conflicts with trust boundaries or Model 4
- Record the decision in the right doc (phase-1-mvp.md or a phase-1/*.md subdoc)
- Mark resolved vs still open in docs/open-questions.md
- Defer out-of-scope items explicitly to docs/system-design/phase-2/ or phase-3/ with a link
- Do not implement code until we agree on the design for that branch (unless I say otherwise)

When UI or behavior is agreed, check docs/tests/acceptance-criteria/ and update scenarios if needed (depth-first by screen and flow per .cursor/rules/bdd-depth-first.mdc).

Follow project copy style: no em dashes or en dashes in user-facing text.
```

## Design tree (reference)

Use this map to ensure no branch is skipped:

| Branch | Primary doc |
|--------|-------------|
| Scope, stack, PoC exit criteria | [phase-1-mvp.md](../../system-design/phase-1/phase-1-mvp.md) |
| Trust zones 1/2/3 | [trust-model.md](../../system-design/phase-1/trust-model.md) |
| Services, stores, deployment | [architecture.md](../../system-design/phase-1/architecture.md) |
| Entities and invariants | [domain-model.md](../../domain-model.md) |
| Model 4 lifecycle | [escrow-lifecycle.md](../../system-design/phase-1/escrow-lifecycle.md) |
| Zone 1 on-ramp | [fiat-on-ramp.md](../../system-design/phase-1/fiat-on-ramp.md) |
| Zone 3 off-ramp | [fiat-off-ramp.md](../../system-design/phase-1/fiat-off-ramp.md) |
| On-chain custody | [smart-contracts.md](../../system-design/phase-1/smart-contracts.md) |
| Wallet and auth | [wallet-and-auth.md](../../system-design/phase-1/wallet-and-auth.md) |
| Disputes and pool | [arbitration.md](../../system-design/phase-1/arbitration.md) |
| Merchant SDK and checkout | [merchant-and-checkout.md](../../system-design/phase-1/merchant-and-checkout.md) |
| KYC and AML | [compliance-and-kyc.md](../../system-design/phase-1/compliance-and-kyc.md) |
| Reserve and PoR | [reserve-management.md](../../system-design/phase-1/reserve-management.md) |
| Cron and indexer | [background-jobs.md](../../system-design/phase-1/background-jobs.md) |
| API conventions | [api-contracts.md](../../system-design/phase-1/api-contracts.md) |
| Client apps | [client-applications.md](../../system-design/phase-1/client-applications.md) |
| Third-party integrations | [integrations.md](../../system-design/phase-1/integrations.md) |
| Ops and deploy | [deployment-and-ops.md](../../system-design/phase-1/deployment-and-ops.md) |
| Public verify APIs | [verifiability-apis.md](../../system-design/phase-1/verifiability-apis.md) |
| Acceptance tests | [acceptance-criteria/README.md](../../tests/acceptance-criteria/README.md) and surface files |
| Roadmap deferrals | [phase-2/](../../system-design/phase-2/), [phase-3/](../../system-design/phase-3/) |

## Exit criteria (north star)

From [poc-accelerator-plan.md](../../business/funding/poc-accelerator-plan.md) and [phase-1-mvp.md](../../system-design/phase-1/phase-1-mvp.md):

- End-to-end: invite → accept → Paystack fund → delivery → confirm or auto-release → bank payout
- Funds in Escrow.sol before "protected" UX; post-Paystack deploy requires buyerSig
- Disputed funds release only via ArbitrationPool after juror tally
- Model 4: single anchor deliveryDueAt; deliveredAt evidence-only
- PoC metrics: ≥95% fund-and-release; 100+ deals M2; 5+ disputes M3; 2–3 merchant pilots M4
- All agreed Phase 1 BDD scenarios pass (when automated harness exists)
- Critical/High smart contract audit items closed before mainnet

## Trust boundaries (check every decision)

- Zone 2: no admin, staff key, or single arbitrator EOA moves active escrow cNGN
- Disputes: only ArbitrationPool.execute() after on-chain tally
- Zones 1 and 3: trust + verifiable (Paystack ref, on-chain transfer, partner payout ref)
- Model 4: deliveredAt never shifts auto-release or dispute window
- User keys: KDF v1 on-device; server never stores W
- Honest copy: not "fully trustless" end-to-end; fiat ramps involve Holdam/partners

## Phase 2 / 3 pointers (do not implement in Phase 1 interview unless scoped)

| Topic | Doc |
|-------|-----|
| Convexity issueToAddress, payment pre-spec, QR invite | [trust-minimization-roadmap.md](../../system-design/phase-2/trust-minimization-roadmap.md), [payment-prespec-and-qr-invite.md](../../system-design/phase-2/payment-prespec-and-qr-invite.md) |
| Merchant GA, mainnet VRF | [phase-2-production-launch.md](../../business/operations/phase-2-production-launch.md), [decentralized-arbitration.md](../../system-design/phase-2/decentralized-arbitration.md) |
| Cross-currency, microservices, DAO params | [phase-3/](../../system-design/phase-3/) |

## Related prompts

| Goal | Prompt |
|------|--------|
| Audit codebase vs design (live paths; design fidelity) | [phase-1-design-codebase-live-path-audit.md](phase-1-design-codebase-live-path-audit.md) |
| Generate test specs from Phase 1 design | [phase-1-test-docs-from-design.md](phase-1-test-docs-from-design.md) |
| Audit test spec coverage | [phase-1-test-docs-coverage-audit.md](phase-1-test-docs-coverage-audit.md) |
| Decide testing strategy | [tests/README.md](../../tests/README.md) |
