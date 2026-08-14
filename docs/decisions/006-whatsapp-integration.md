# ADR-006 — WhatsApp Integration

**Date:** 2026-08  
**Status:** Architectural direction defined; provider pending budget confirmation  
**Decision makers:** Technical team

---

## Context

The ERS enables WhatsApp at two points: reception of quotation requests (UC-13, manual registration with attached documentation) and automatic sending of the quotation report (UC-21, with the offer's validity tied to that send by business rule RN-06). The domain model represents this through **SM (Servidor de mensajería)**, an abstract external actor not tied to any provider.

Reception of requests and Purchase Orders via WhatsApp remains a manual registration step (RN-01, RN-03); parsing inbound messages is out of scope. What requires a real integration is the outbound send of the quotation PDF and, in the future, work order delay notifications from the scheduler.

## Options evaluated

### Option A: Unofficial libraries (whatsapp-web.js, Baileys)

**Pros:**
- No per-message cost or prior approval from Meta.
- Fully free-form text messages, no template restrictions.

**Cons:**
- Violates WhatsApp's Terms of Service; risk of the number being blocked, and that same number is used to receive Purchase Orders (RN-01/RN-03).
- Requires maintaining a device-linked session (periodic QR re-scan), unstable for an unsupervised server process.
- No official support or SLA.

### Option B: Official WhatsApp Business Platform via a third-party BSP (Twilio, 360dialog, Gupshup)

**Pros:**
- Compliant with Meta's Terms of Service.
- Mature, well-documented template and webhook management.
- Provider independence: allows switching BSPs without changing platform.

**Cons:**
- Adds a vendor, a contract, and billing outside the AWS account already adopted in ADR-009.
- Requires managing additional credentials and a separate dashboard.

### Option C: Official WhatsApp Business Platform via AWS End User Messaging Social

**Pros:**
- Same Meta Cloud API and same compliance guarantees as Option B.
- Stays within the AWS account already defined in ADR-009 (same IAM, same billing, logs can be centralized in CloudWatch).
- Adds no new vendor relationship for the team.

**Cons:**
- Less third-party documentation and community than an established BSP like Twilio.
- Depends on the availability of the AWS account, a dependency the rest of the system already assumes per ADR-009.

## Provisional recommendation

Option A is discarded: the risk of the number being blocked compromises a channel that also receives Purchase Orders, not just outbound notifications. Between Options B and C, the team provisionally leans toward **AWS End User Messaging Social** (Option C), for its consistency with the infrastructure already defined in ADR-009. If the budget the client confirms, or some operational requirement not covered by AWS, makes a third-party BSP more suitable, Option B remains a valid alternative.

## Decision

The final decision is to adopt the **official WhatsApp Business Platform** as the architectural direction; unofficial libraries are discarded.

The choice between a third-party BSP (Option B) and AWS End User Messaging Social (Option C) is not closed in this ADR: it is conditioned on the Product Owner confirming with the client the monthly budget available for this integration. Until that confirmation, AWS End User Messaging Social is the provider recommended by the technical team.

## Pending items

**Architectural decisions:** none pending — the use of the official WhatsApp Business Platform is defined.

**Business / budget decisions:**
- The Product Owner must consult and confirm with the client the monthly budget available for WhatsApp, and use it as a criterion to choose between AWS End User Messaging Social and a third-party BSP.
- Confirm the exact per-message rate for Argentina once the provider is defined.

**Future implementation tasks:**
- Start WABA verification in Meta Business Manager.
- Provision the dedicated WhatsApp Business phone number.
- Define and submit for approval the required templates (quotation sent, expiration reminder, delay notice, delivery confirmation, generic fallback).
- Log delivery/read status of outbound messages so a failed send can be flagged to the Encargado de Cotización.
