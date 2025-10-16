---
title: Data Processing Addendum (DPA)
description: GDPR-compliant Data Processing Addendum for Enterprise customers. Defines data processing terms per Article 28.
slug: dpa
keywords: [DPA, data processing addendum, GDPR, Article 28, controller, processor, sub-processors, SCC]
canonical: https://saturn.io/legal/dpa
lastReviewed: 2025-10-16
---

# Data Processing Addendum (DPA)

**Last Updated:** October 16, 2025

**Effective Date:** Upon execution by both parties

This Data Processing Addendum ("DPA") supplements the Saturn Terms of Service and applies to Enterprise customers who are subject to data protection laws, including the EU General Data Protection Regulation (GDPR).

---

## 1. Definitions

**"Controller"**: The Customer, who determines the purposes and means of processing Personal Data.

**"Processor"**: Saturn, Inc., who processes Personal Data on behalf of the Controller.

**"Personal Data"**: Any information relating to an identified or identifiable natural person, as defined in the GDPR.

**"Processing"**: Any operation performed on Personal Data, including collection, storage, use, transmission, or deletion.

**"Sub-processor"**: Any third party engaged by Saturn to process Personal Data.

**"Data Subject"**: An individual whose Personal Data is processed.

**"Services"**: Saturn's cron and scheduled job monitoring platform, as described in the Terms of Service.

**"Supervisory Authority"**: An independent public authority established by an EU Member State pursuant to GDPR Article 51.

**"Terms"**: Saturn's Terms of Service, available at https://saturn.io/legal/terms.

---

## 2. Parties & Scope

### 2.1 Parties

**Controller (Customer)**:

- Legal Name: _____________________________
- Address: _____________________________
- Contact: _____________________________

**Processor (Saturn)**:

- Legal Name: Saturn, Inc. <!-- TODO: Verify legal entity name -->
- Address: <!-- TODO: Add physical address -->
- Contact: legal@saturn.io

### 2.2 Effective Date

This DPA takes effect upon execution by authorized representatives of both parties.

### 2.3 Scope of DPA

This DPA applies to all Personal Data processed by Saturn on behalf of Customer in connection with the Services, as described in **Annex A** (Details of Processing).

---

## 3. Data Processing Terms

### 3.1 Roles and Compliance

- **Customer** acts as the Controller (or Processor, if Customer processes data on behalf of another entity).
- **Saturn** acts as the Processor, processing Personal Data only on documented instructions from Customer.
- Saturn shall comply with GDPR Article 28 and other applicable data protection laws.

### 3.2 Instructions

Saturn will process Personal Data only:

1. As necessary to provide the Services under the Terms;
2. As documented in this DPA and Annexes;
3. As instructed by Customer via the Services (e.g., configuring monitors, enabling output capture, setting retention policies); and
4. As required by applicable law (Saturn will notify Customer of such legal requirements, unless prohibited by law).

**Additional Instructions**: Customer may issue additional written instructions via email to legal@saturn.io. Saturn will confirm feasibility and may charge additional fees for instructions requiring material changes to the Services.

### 3.3 Customer's Obligations

Customer warrants that:

- It has the legal right to transfer Personal Data to Saturn for processing;
- It has obtained necessary consents from Data Subjects (where required);
- Its instructions comply with applicable data protection laws;
- It has informed Data Subjects of the processing, including Saturn's role as Processor.

---

## 4. Sub-processors

### 4.1 General Authorization

Customer provides **general written authorization** for Saturn to engage Sub-processors, subject to the terms of this Section 4.

### 4.2 Current Sub-processors

Saturn currently engages the following Sub-processors:

| Sub-processor | Service | Location | Purpose |
|---------------|---------|----------|---------|
| Vercel Inc. | Web Hosting | USA (Global Edge Network) | Application hosting, serverless functions |
| Fly.io, Inc. | Worker Hosting | USA <!-- TODO: Specify regions --> | Background job processing, alert delivery |
| Neon, Inc. | Database | USA <!-- TODO: Specify regions --> | PostgreSQL database hosting |
| Upstash, Inc. | Caching & Queues | USA <!-- TODO: Specify regions --> | Redis caching, BullMQ job queues |
| <!-- TODO: MinIO provider --> | Object Storage | <!-- TODO: Specify --> | Output capture storage (S3-compatible) |
| Sentry.io, Inc. | Error Tracking | USA | Application error monitoring |
| Resend, Inc. | Email Delivery | USA | Transactional email delivery |
| Stripe, Inc. | Payment Processing | USA/Ireland | Subscription billing, invoicing |

**Updated List**: An up-to-date list of Sub-processors is maintained at https://saturn.io/legal/sub-processors <!-- TODO: Create sub-processor list page -->.

### 4.3 Sub-processor Obligations

Saturn ensures that each Sub-processor:

- Enters into a written contract imposing data protection obligations at least as protective as this DPA;
- Implements appropriate technical and organizational security measures (GDPR Article 32);
- Complies with GDPR Article 28 requirements;
- Is subject to audit rights equivalent to those granted to Customer (Section 8).

Saturn remains fully liable to Customer for any Sub-processor's failure to fulfill data protection obligations.

### 4.4 Notice of New Sub-processors

Saturn will notify Customer at least **30 days in advance** of engaging a new Sub-processor or materially changing an existing Sub-processor, via:

- Email to Customer's account administrator;
- Notice on the Saturn changelog at https://saturn.io/changelog; and
- Update to the Sub-processor list page.

### 4.5 Customer Objection

Customer may object to a new or changed Sub-processor on **reasonable grounds relating to data protection**. Customer must notify Saturn in writing within **14 days** of receiving notice.

If Customer objects, Saturn will use reasonable efforts to:

1. Make available a change in the Services or recommend a commercially reasonable alternative; or
2. If no alternative is available, Customer may terminate the affected Services and receive a pro-rata refund for any prepaid, unused fees.

---

## 5. Security Measures

### 5.1 Technical and Organizational Measures (TOMs)

Saturn implements appropriate technical and organizational measures to protect Personal Data against:

- Accidental or unlawful destruction;
- Loss, alteration, unauthorized disclosure, or access.

**Security Measures** include (see **Annex B** for full details and [Security Overview](/legal/security)):

- **Encryption**: TLS 1.2+ in transit, AES-256 at rest (provider-managed keys);
- **Access controls**: Role-based access control (RBAC), multi-factor authentication (MFA) for employees;
- **Row-level security (RLS)**: Database queries automatically scoped to Customer's organization;
- **Token hashing**: API tokens hashed with SHA-256;
- **Rate limiting**: 60-120 requests/minute to prevent abuse;
- **Secure headers**: HSTS, CSP, X-Frame-Options, X-Content-Type-Options;
- **Audit logging**: All administrative actions logged with timestamps;
- **Incident response**: Documented procedures for security breaches.

### 5.2 Security Documentation

Upon request, Saturn will provide:

- High-level security documentation (publicly available at https://saturn.io/legal/security);
- Summary of security certifications (SOC 2, ISO 27001, when available <!-- TODO: Add when obtained -->);
- Evidence of Sub-processor security compliance.

Saturn will not provide detailed security information (e.g., architecture diagrams, penetration test results) unless required by law or under NDA for legitimate audit purposes (see Section 8).

---

## 6. Data Subject Rights

### 6.1 Assistance with Data Subject Requests

Saturn will, to the extent permitted by law, **promptly notify Customer** if Saturn receives a request from a Data Subject to exercise rights under GDPR (access, rectification, erasure, restriction, portability, objection).

Saturn will **not respond** to Data Subject requests directly unless required by law. Customer is responsible for responding to Data Subjects.

### 6.2 Providing Assistance

Saturn will provide commercially reasonable assistance to Customer in fulfilling Data Subject requests, including:

- **Access**: Providing Customer with export of Personal Data in machine-readable format (JSON/CSV);
- **Rectification**: Enabling Customer to correct inaccurate data via the Services;
- **Erasure**: Deleting Personal Data upon Customer's instruction (within 30 days);
- **Restriction**: Temporarily suspending processing (e.g., disabling monitors during investigation);
- **Portability**: Exporting data in structured, machine-readable format.

**Charges**: Saturn may charge reasonable fees for assistance that requires significant manual effort beyond the Services' built-in functionality.

---

## 7. Data Breach Notification

### 7.1 Notification Obligation

Saturn will notify Customer **without undue delay** (and in any event **within 72 hours**) of becoming aware of a Personal Data Breach affecting Customer's Personal Data.

### 7.2 Notification Content

Saturn's notification will include (to the extent known):

1. Nature of the breach (categories and approximate number of Data Subjects and records affected);
2. Contact point for further information (security@saturn.io);
3. Likely consequences of the breach;
4. Measures taken or proposed to address the breach and mitigate harm.

### 7.3 Saturn's Obligations

Saturn will:

- Investigate the breach and take reasonable steps to remediate;
- Cooperate with Customer's investigation;
- Provide updates as new information becomes available.

**Customer's Obligations**: Customer is responsible for notifying Supervisory Authorities and Data Subjects as required by GDPR Article 33-34. Saturn will provide reasonable assistance.

### 7.4 Breach Definition

"Personal Data Breach" means a breach of security leading to accidental or unlawful destruction, loss, alteration, unauthorized disclosure of, or access to, Personal Data transmitted, stored, or otherwise processed.

**Excludes**: Unsuccessful attempts (e.g., blocked DDoS attacks, failed login attempts) or incidents where Saturn promptly determines no Personal Data was accessed or compromised.

---

## 8. Audits and Inspections

### 8.1 Audit Rights

Customer may audit Saturn's compliance with this DPA, subject to the following:

1. **Frequency**: Once per calendar year, unless required more frequently by a Supervisory Authority or in response to a Data Breach;
2. **Advance notice**: At least 30 days' written notice to legal@saturn.io;
3. **Scope**: Limited to data protection obligations in this DPA;
4. **Confidentiality**: Auditor must sign Saturn's standard NDA;
5. **Timing**: During business hours, with minimal disruption to Saturn's operations;
6. **Costs**: Customer bears all audit costs (auditor fees, travel); Saturn may charge reasonable fees for employee time if audit exceeds 8 hours.

### 8.2 Audit Alternatives

In lieu of on-site audits, Saturn may provide:

- **SOC 2 Type II reports** (when available <!-- TODO: Target date -->);
- **ISO 27001 certification** (if obtained);
- **Third-party pen test reports** (executive summary, redacted);
- **Completed audit questionnaires** (e.g., CAIQ, SIG).

Customer agrees to accept such documentation as satisfying audit requirements, unless a Supervisory Authority specifically requires an on-site audit.

### 8.3 Sub-processor Audits

Customer may request evidence of Sub-processor compliance (security certifications, audit reports). Saturn will use reasonable efforts to obtain such documentation from Sub-processors, subject to NDA and Sub-processor consent.

---

## 9. International Data Transfers

### 9.1 Data Residency

Personal Data may be stored and processed in the following regions:

<!-- TODO: Specify exact regions once infrastructure is finalized, e.g., "USA (primary), EU (optional for Enterprise customers)" -->

- **Primary region**: United States of America
- **Optional regions**: <!-- TODO: EU, if offered -->

### 9.2 EEA/UK Transfers

For Personal Data originating from the European Economic Area (EEA), United Kingdom, or Switzerland, Saturn relies on:

**Standard Contractual Clauses (SCCs)**: The EU Commission's Standard Contractual Clauses for international data transfers (Module 2: Controller-to-Processor), as adopted by Commission Implementing Decision (EU) 2021/914, are hereby incorporated by reference and form **Annex C** to this DPA.

**Supplementary Measures**: Saturn implements additional safeguards:

- Encryption in transit (TLS 1.3) and at rest (AES-256);
- Access controls limiting personnel who can access EEA data;
- Contractual prohibitions on unauthorized disclosure;
- Commitment to challenge government requests for EEA data where lawful to do so.

### 9.3 UK Addendum

For transfers from the UK, the **UK International Data Transfer Addendum** to the SCCs (version B1.0) applies and is incorporated as **Annex D**.

### 9.4 Swiss Addendum

For transfers from Switzerland, the SCCs are modified to replace references to "GDPR" with the Swiss Federal Act on Data Protection (FADP), and "Supervisory Authority" with the Swiss Federal Data Protection and Information Commissioner (FDPIC).

### 9.5 Adequacy Decisions

If the European Commission adopts an adequacy decision for a country where Saturn processes data, transfers to that country will rely on such adequacy decision instead of SCCs.

---

## 10. Return and Deletion of Data

### 10.1 Upon Termination

Upon termination of the Terms or upon Customer's written request, Saturn will (at Customer's choice):

1. **Return** all Customer Personal Data in machine-readable format (JSON/CSV export via API or dashboard download); OR
2. **Delete** all Customer Personal Data from production systems and backups.

**Timeline**: Within **30 days** of termination or request.

### 10.2 Exceptions

Saturn may retain Personal Data to the extent required by applicable law (e.g., tax records, fraud prevention) or as necessary to resolve disputes. Saturn will notify Customer of such retention requirements.

Retained data remains subject to confidentiality obligations and this DPA until deletion.

### 10.3 Deletion Certification

Upon request, Saturn will provide written certification that Personal Data has been deleted, including:

- Date of deletion;
- Categories of data deleted;
- Systems from which data was deleted (production database, object storage, backups).

---

## 11. Liability and Indemnification

### 11.1 Liability Allocation

Each party's liability under this DPA is subject to the limitations and exclusions in the Terms, except where GDPR or applicable law prohibits such limitations.

Saturn is liable to Customer for damages arising from Saturn's breach of this DPA, **to the extent attributable to Saturn's processing of Personal Data**.

### 11.2 Indemnification

Customer agrees to indemnify Saturn against third-party claims arising from:

- Customer's failure to comply with data protection laws;
- Customer's instructions that cause Saturn to violate applicable law;
- Customer's failure to obtain necessary consents from Data Subjects.

---

## 12. Term and Termination

### 12.1 Term

This DPA takes effect on the Effective Date and continues as long as Saturn processes Customer Personal Data under the Terms.

### 12.2 Termination of Services

If Customer terminates the Services, this DPA remains in effect during the wind-down period (up to 30 days) until all Personal Data is returned or deleted per Section 10.

### 12.3 Survival

Sections 5 (Security), 7 (Data Breach), 10 (Return/Deletion), 11 (Liability), and 13 (General Terms) survive termination.

---

## 13. General Terms

### 13.1 Order of Precedence

In the event of a conflict:

1. This DPA prevails over the Terms with respect to data protection;
2. Annexes to this DPA prevail over the main DPA text;
3. SCCs (Annex C) prevail over conflicting DPA provisions (as required by GDPR).

### 13.2 Amendments

Saturn may update this DPA to reflect changes in law or Sub-processors (with 30 days' notice per Section 4.4). Material changes require Customer's consent (expressed via continued use or written acceptance).

### 13.3 Severability

If any provision is found unenforceable, the remaining provisions remain in effect. The parties will negotiate a replacement provision that achieves the original intent.

### 13.4 Governing Law

This DPA is governed by the same law as the Terms <!-- TODO: Specify governing law once Terms are finalized -->.

---

## Signatures

By executing this DPA, the parties agree to its terms.

**CUSTOMER:**

Signature: ___________________________

Name: ___________________________

Title: ___________________________

Date: ___________________________

**SATURN, INC.:**

Signature: ___________________________

Name: ___________________________

Title: ___________________________

Date: ___________________________

---

## Annex A: Details of Processing

### Subject Matter

Processing of Personal Data in connection with Saturn's cron and scheduled job monitoring Services, including anomaly detection, alerting, and analytics.

### Duration

For the term of the Services agreement, plus 30 days wind-down period.

### Nature and Purpose

- Monitor cron job and scheduled task execution;
- Detect anomalies using statistical analysis (Welford algorithm, z-score);
- Send alerts via email, Slack, Discord, webhooks;
- Generate analytics (health scores, MTBF, MTTR, uptime);
- Store optional job output for debugging (if Customer enables output capture).

### Categories of Data Subjects

- **Employees/Contractors**: Customer's DevOps engineers, SREs, system administrators who use the Services;
- **End Users** (indirect): If Customer's monitored jobs process end-user data, output capture may include such data (Customer's responsibility to control).

### Types of Personal Data

- **Account data**: Email addresses, names, profile pictures (OAuth);
- **Usage data**: IP addresses (for rate limiting), user agent strings, login timestamps;
- **Monitoring metadata**: Monitor names (may include project/customer identifiers), cron schedules, timestamps, durations;
- **Optional output capture**: Job stdout/stderr (may include any data Customer's jobs output, including potentially PII, depending on Customer's job logic);
- **Integration data**: Slack workspace IDs, Discord server names, webhook URLs;
- **Audit logs**: Administrative actions (user invitations, role changes).

### Special Categories of Data

Saturn does **NOT process special categories of data (GDPR Article 9)** such as health data, biometric data, genetic data, or data revealing racial/ethnic origin, political opinions, religious beliefs, trade union membership, sex life, or sexual orientation — **UNLESS** Customer's jobs output such data and Customer enables output capture.

**Customer Responsibility**: Customer must not enable output capture for jobs that output special categories of data without implementing additional safeguards (encryption, pseudonymization) and obtaining explicit Data Subject consent.

---

## Annex B: Security Measures

See [Security Overview](/legal/security) for comprehensive details. Summary:

### Technical Measures

- **Encryption**: TLS 1.2+ (in transit), AES-256 (at rest, provider-managed keys);
- **Token hashing**: SHA-256 for API tokens;
- **Input validation**: Zod schemas, parameterized queries (Prisma ORM);
- **Rate limiting**: Redis-backed sliding window (60-120 req/min);
- **CSRF protection**: NextAuth v5 double-submit cookies;
- **Secure headers**: HSTS, CSP, X-Frame-Options, X-Content-Type-Options.

### Organizational Measures

- **Access controls**: RBAC, MFA for employees, least privilege;
- **Audit logging**: Timestamp, actor, action for all administrative events;
- **Incident response plan**: Detection, triage, containment, notification, remediation;
- **Vendor management**: Due diligence on Sub-processors (SOC 2 certification required);
- **Employee training**: Annual security training, phishing simulations.

### Physical Measures

Physical security is managed by Sub-processors:

- **Data centers**: SOC 2-certified facilities with 24/7 surveillance, biometric access, redundant power;
- **Disaster recovery**: Automated backups (30-day retention), geographic redundancy.

---

## Annex C: Standard Contractual Clauses (SCCs)

The **EU Standard Contractual Clauses for International Data Transfers (Module 2: Controller-to-Processor)**, as adopted by Commission Implementing Decision (EU) 2021/914 of 4 June 2021, are incorporated by reference.

**Clause-Specific Details**:

- **Clause 7 (Docking Clause)**: Not applicable.
- **Clause 9(a) (Use of Sub-processors)**: Customer provides general authorization per Section 4 of this DPA.
- **Clause 11(a) (Redress)**: Data Subjects may contact Saturn at legal@saturn.io or invoke Section 13 of this DPA.
- **Clause 13 (Supervision)**: Supervisory Authority is the authority in Customer's EEA Member State.
- **Clause 17 (Governing Law)**: Laws of <!-- TODO: Specify EEA member state, e.g., Ireland or Customer's location -->.
- **Clause 18 (Choice of Forum)**: Courts of <!-- TODO: Specify EEA member state -->.

**Optional Clauses**: Clauses 7, 11(a), and 18(b) are selected.

Full text of SCCs available at: https://eur-lex.europa.eu/eli/dec_impl/2021/914/oj

---

## Annex D: UK International Data Transfer Addendum

The **UK International Data Transfer Addendum to the EU Commission Standard Contractual Clauses (Version B1.0)**, issued by the UK Information Commissioner's Office (ICO), is incorporated by reference for transfers from the UK.

**Addendum-Specific Details**:

- **Table 1 (Parties)**: As specified in Section 2 of this DPA.
- **Table 2 (SCCs)**: Module 2 (Controller-to-Processor).
- **Table 3 (Appendix Information)**: As specified in Annexes A & B of this DPA.
- **Table 4 (Ending Date)**: Co-terminus with the Services agreement.

Full text of UK Addendum available at: https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/international-data-transfer-agreement-and-guidance/

---

## Contact for DPA Questions

- **Email**: legal@saturn.io
- **Subject Line**: "DPA Inquiry - [Customer Name]"
- **Mailing Address**: <!-- TODO: Add Saturn's physical mailing address -->

---

**End of Data Processing Addendum**

**Last Updated**: October 16, 2025


