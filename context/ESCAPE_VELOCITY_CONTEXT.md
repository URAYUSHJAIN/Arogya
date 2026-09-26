# Escape Velocity Hackathon 1.0 --- Complete Project Context

> **Purpose of this file:** This document is the master hackathon
> context for Claude Code, Codex, and other AI coding assistants working
> on this repository.
>
> It combines the official Escape Velocity event information, the
> assigned P-02 problem statement, the scoring rubric, the event rules
> shown to participants, and the project-development constraints.
>
> **Important:** AI assistants must treat this document as context and
> must never claim that a requirement is satisfied unless the
> implementation, tests, or working demo actually prove it.

------------------------------------------------------------------------

# 1. Event Identity

## Hackathon

**Escape Velocity Hackathon 1.0**

-   Hosted by: **Velloe**
-   Funded by: **EVOCS (Evolution Cloud Services)**
-   Venue: **Velloe AI Innovation Center, Noida**
-   Date: **Saturday, September 26, 2026**
-   Build window: **9:00 AM -- 6:00 PM**
-   Format: **Individual / solo build**
-   Participants: **100 individual builders**
-   Mentor structure: **10 mentor pods × 10 builders**
-   Finalists: **30 total --- top 3 from each mentor pod**
-   Submission: public GitHub repository + required submission process
    and short pitch/video
-   Official event page: https://velloe.tech/escape-velocity

The official event page describes Escape Velocity as a one-day build
focused on enterprise AI problems including document intelligence,
enterprise RAG, and multi-agent systems.

------------------------------------------------------------------------

# 2. Why the Hackathon Exists

Escape Velocity is presented as Velloe's first external build day,
backed by EVOCS.

The event is designed around the kinds of AI and enterprise engineering
problems Velloe/EVOCS works with.

The official event description emphasizes:

-   enterprise AI
-   document intelligence
-   retrieval-augmented systems
-   multi-agent systems
-   infrastructure intelligence
-   AI-enabled execution
-   practical engineering
-   working systems rather than slide-only concepts

The event is also connected to a potential Velloe internship pipeline:

``` text
Build
  ↓
Pitch video
  ↓
Jury review
  ↓
Pod shortlist
  ↓
Interview
  ↓
Potential internship offer
```

Do not interpret this as a guarantee of an internship or offer.

------------------------------------------------------------------------

# 3. Participant Format

## Solo build

The event is an individual build.

There are no teams to assemble.

Every participant:

-   receives a problem statement
-   builds independently
-   receives mentor support
-   submits their own project
-   presents their own implementation

------------------------------------------------------------------------

# 4. Event Schedule

## Main build window

``` text
09:00
  ↓
Build starts
  ↓
Implementation
  ↓
Testing
  ↓
Demo preparation
  ↓
Pitch recording / submission
  ↓
15:30 submission deadline
  ↓
18:00 end of build day
```

### Critical deadline

The rules slide explicitly states:

> **Missing the 15:30 submission deadline is not allowed and
> disqualifies the submission.**

Therefore the project must have a submission-ready checkpoint before
15:30.

Recommended internal deadline:

``` text
14:30 — freeze core implementation
14:30–15:00 — final test + demo verification
15:00–15:20 — submission preparation
15:20 — final safety check
15:30 — submission deadline
```

The exact internal schedule is a project strategy, not an official event
rule.

------------------------------------------------------------------------

# 5. Official Problem Tracks

The official event page lists six tracks.

## Track 01 --- The Living Enterprise

**Theme:** Multi-agent / agentic architecture

Build a multi-agent system involving roles such as:

-   planner
-   retriever
-   executor
-   validator

The system should take a complex enterprise request from intake toward
resolution.

Expected thinking:

-   decompose the request into roles
-   define handoffs
-   define failure modes
-   define human sign-off points
-   demonstrate one realistic end-to-end scenario

Expected archive/demo artifacts include:

-   working demo
-   agent-role diagram
-   full trace from intake to resolution
-   explanation of future hardening

------------------------------------------------------------------------

## Track 02 --- Ask the Company Anything

**Theme:** Enterprise RAG

Build a retrieval-augmented assistant over messy enterprise documents
that answers natural-language questions with citations to the exact
source.

Official guidance emphasizes:

-   start with messy documents
-   prioritize citation fidelity over fluency
-   if the system cannot point to the source, it should not answer
-   test questions designed to break naive retrieval

Expected artifacts include:

-   query UI
-   inline citations
-   evaluation notes on hard questions
-   short explanation of chunking choices
-   short explanation of embedding choices

------------------------------------------------------------------------

## Track 03 --- The Knowledge Graph That Talks Back

**Theme:** Graph RAG

Build a system combining:

-   knowledge graph traversal
-   vector retrieval

The target is a multi-hop question that flat RAG cannot answer reliably.

Expected artifacts include:

-   mini knowledge graph
-   visible hybrid retrieval path
-   live multi-hop demonstrated with evidence

------------------------------------------------------------------------

## Track 04 --- Healthcare From Zero

**Theme:** Healthcare greenfield product

Design and prototype a healthcare product from a blank slate, such as:

-   patient intake/triage copilot
-   clinical documentation assistant

The official guidance emphasizes:

-   privacy
-   auditability
-   one focused workflow
-   data-flow documentation
-   privacy/threat thinking

Expected artifacts include:

-   clickable prototype
-   one-page privacy/threat sketch
-   explicit audit trail for a user journey

------------------------------------------------------------------------

## Track 05 --- Paper to Structured Truth

**Theme:** Document intelligence

Process unstructured/scanned documents and extract structured,
verifiable data from:

-   handwriting
-   tables
-   inconsistent layouts
-   noisy scans

Expected artifacts include:

-   before/after for multiple document types
-   structured output
-   validation
-   failure cases

------------------------------------------------------------------------

## Track 06 --- The Silent Breach

**Theme:** AI cybersecurity

Detect anomalous behavior in:

-   logs
-   network traffic
-   user activity

The system should explain why an alert was generated.

Expected artifacts include:

-   detection on sample telemetry
-   reasoning/evidence panel
-   deliberately avoided false positive

------------------------------------------------------------------------

# 6. ASSIGNED PROBLEM --- P-02

## Healthcare Greenfield Enterprise RAG --- Retrieval a Clinical Team Can Rely On

**Assigned track: P-02**

The project must be built specifically against the P-02 requirements
below.

------------------------------------------------------------------------

# 7. P-02 Background

A healthcare organisation's working knowledge is spread across:

-   clinical guidelines
-   internal SOPs
-   formularies
-   payer policies
-   device manuals
-   operational records

A greenfield deployment has:

-   no legacy search layer to inherit
-   no curated index to start from

This creates an opportunity to design retrieval around the failure modes
that matter.

In healthcare:

> **A confident wrong answer is more expensive than no answer at all.**

Sources may also contradict each other because they were written:

-   in different years
-   by different committees
-   for different policies or contexts

------------------------------------------------------------------------

# 8. P-02 Challenge

Build an enterprise retrieval-augmented system for a healthcare
organisation starting from zero.

The system must cover:

``` text
Ingestion
    ↓
Retrieval
    ↓
Grounding
    ↓
Citation
    ↓
Refusal
```

The result should be a system that a clinical or operations user could:

-   interrogate
-   inspect
-   audit

------------------------------------------------------------------------

# 9. P-02 Core Requirements

## R1 --- Heterogeneous Corpus

The system must ingest a heterogeneous corpus containing:

-   long guideline documents
-   short policies
-   structured records
-   at least one table-heavy source

The implementation must demonstrate that these source types can
participate in retrieval.

------------------------------------------------------------------------

## R2 --- Natural-Language Questions

Users must be able to ask natural-language questions.

The system must answer using retrieved organizational evidence rather
than unsupported model knowledge.

------------------------------------------------------------------------

## R3 --- Every Claim Must Be Traceable

Every claim in an answer must be traceable to the passage from which it
came.

The user must be able to access the source in one click.

Citation metadata should be precise enough to identify the evidence.

Possible granularity:

-   document
-   page
-   section
-   paragraph
-   passage
-   table
-   row
-   clause

------------------------------------------------------------------------

## R4 --- Conflict Handling

Sources can disagree.

The system must:

-   detect/surface disagreement
-   show relevant conflicting evidence
-   avoid silently choosing one source
-   make the disagreement visible to the user

Example:

``` text
Guideline 2024
    → Protocol A

Policy 2026
    → Protocol B

        ↓

CONFLICT DETECTED

        ↓

Show both sources
        ↓
Show version/status metadata
        ↓
Explain the conflict
```

------------------------------------------------------------------------

## R5 --- Insufficient Evidence

When evidence is insufficient, the system must:

-   refuse OR escalate
-   state what evidence is missing

It must not generate a confident unsupported answer.

Example:

``` text
I cannot answer this from the available evidence.

Missing evidence:
- current payer policy
- procedure-specific rule

No unsupported conclusion was generated.
```

------------------------------------------------------------------------

## R6 --- Retrieval-Level Access Control

Different users may have access to different documents.

Authorization must happen **inside the retrieval path**.

Incorrect:

``` text
Retrieve everything
    ↓
Send everything to LLM
    ↓
Hide unauthorized data in frontend
```

Required security direction:

``` text
User
  ↓
Identity / role
  ↓
Permission-aware retrieval
  ↓
Only authorized evidence
  ↓
LLM
```

Unauthorized content must not simply be retrieved and hidden by the UI.

------------------------------------------------------------------------

## R7 --- Synthetic / De-identified Data

Use:

-   synthetic data OR
-   de-identified data

No real personal or patient data may be used.

The system should demonstrate that identifiers cannot leak into
generated answers.

------------------------------------------------------------------------

## R8 --- Quality Measurement

Define a question set and measure system quality.

The question set may be small, but it must be real and reproducible.

Potential categories:

-   normal questions
-   multi-document questions
-   conflict questions
-   unanswerable questions
-   access-control questions

Any reported score must come from an actual evaluation run.

------------------------------------------------------------------------

# 10. P-02 Advanced Directions

The following advanced directions are explicitly listed in the problem
statement.

## A1 --- Hybrid Retrieval

Combine:

-   lexical retrieval
-   dense retrieval
-   reranking

A strong implementation should be able to handle both:

-   exact terminology
-   semantic queries

------------------------------------------------------------------------

## A2 --- Robust Chunking

Chunking should survive:

-   clinical tables
-   long guideline documents
-   approximately 200-page documents

The implementation should preserve document structure.

------------------------------------------------------------------------

## A3 --- Fine-Grained Citations

Citations may point to:

-   passage
-   row
-   clause

The evidence location should be precise.

------------------------------------------------------------------------

## A4 --- Role / Document-Level Authorization

Authorization can use:

-   roles
-   document permissions

The authorization must operate inside retrieval.

------------------------------------------------------------------------

## A5 --- Groundedness / Hallucination Evaluation

The system may measure:

-   groundedness
-   hallucination

and report a measured score.

Never fabricate a metric.

------------------------------------------------------------------------

## A6 --- Freshness / Document Lifecycle

The system may support:

-   guideline versioning
-   supersession
-   retirement

The system should distinguish document versions and lifecycle state when
this capability is implemented.

------------------------------------------------------------------------

# 11. SCORING RUBRIC

The participant scoring slide gives the following weights:

  ------------------------------------------------------------------------
  Criterion                                   Weight Meaning
  --------------------- ---------------------------- ---------------------
  Working demo                               **30%** It runs in front of a
                                                     judge on input the
                                                     judge has not seen

  Problem fit                                **20%** It answers the exact
                                                     statement selected,
                                                     not merely a nearby
                                                     problem

  Technical depth                            **20%** The hard part is
                                                     genuinely solved, not
                                                     stubbed out or mocked

  Originality                                **15%** The approach should
                                                     not feel like
                                                     something the judges
                                                     have already seen
                                                     repeatedly

  Communication                              **15%** Three minutes, clear,
                                                     with no hand-waving
                                                     over gaps
  ------------------------------------------------------------------------

## Total

**100 points**

### Strategic interpretation

The rubric means that implementation priorities should be:

``` text
Working demo       30
      ↓
Problem fit        20
      ↓
Technical depth    20
      ↓
Originality        15
      ↓
Communication      15
```

This is not permission to ignore lower-weight categories.

The project should be built so that every category has visible evidence.

------------------------------------------------------------------------

# 12. WHAT "WORKING DEMO" MEANS

The scoring slide explicitly says:

> It runs in front of a judge, on input it has not seen.

Therefore:

### Bad demo

``` text
Precomputed answer
       ↓
Click button
       ↓
Display answer
```

### Strong demo

``` text
Judge enters a new question
       ↓
Real retrieval
       ↓
Real evidence
       ↓
Real answer
       ↓
Real citation
```

The implementation should not depend on hardcoded answers for the
primary demonstration.

------------------------------------------------------------------------

# 13. WHAT "PROBLEM FIT" MEANS

The score is based on whether the implementation solves the selected
problem rather than a nearby problem.

For P-02, the demo must visibly cover the central requirements:

``` text
Heterogeneous documents
        ↓
Retrieval
        ↓
Grounded answer
        ↓
Citation
        ↓
Conflict handling
        ↓
Refusal
        ↓
Access boundaries
        ↓
Synthetic/de-identified data
        ↓
Evaluation
```

A beautiful healthcare chatbot that does not demonstrate these behaviors
is not sufficient for P-02.

------------------------------------------------------------------------

# 14. WHAT "TECHNICAL DEPTH" MEANS

The scoring slide says:

> The hard part is solved, not stubbed out or mocked.

Therefore:

Avoid:

``` text
Fake retrieval
Fake confidence
Fake citations
Hardcoded answers
Hardcoded evaluation scores
UI-only access control
Mocked security
```

Prefer real implementation of:

-   ingestion
-   parsing
-   chunking
-   indexing
-   retrieval
-   hybrid search
-   reranking
-   authorization
-   conflict detection
-   grounding
-   citations
-   refusal
-   evaluation
-   auditability

------------------------------------------------------------------------

# 15. WHAT "ORIGINALITY" MEANS

The scoring slide gives originality a 15% weight.

For this project, originality should come from the **engineering
approach and product behavior**, not unnecessary visual effects.

Potential differentiators:

-   evidence-first answering
-   explicit conflict surfacing
-   retrieval-level authorization
-   document lifecycle awareness
-   precise passage/table/row citations
-   measurable refusal behavior
-   audit trail
-   evaluation designed around failure cases

Do not add complexity merely to appear original.

------------------------------------------------------------------------

# 16. WHAT "COMMUNICATION" MEANS

Communication has a **15% weight**.

The scoring slide specifies:

> **Three minutes, clear, no hand-waving over the gaps.**

The final pitch should therefore:

1.  Explain the problem.
2.  Show the real system.
3.  Demonstrate the difficult cases.
4.  Explain the technical design.
5.  Show measurable evidence.
6.  Acknowledge known limitations honestly.

Do not spend most of the three minutes explaining generic AI concepts.

------------------------------------------------------------------------

# 17. OFFICIAL RULES --- ALLOWED

The rules slide states the following are allowed:

### 1. Any language, framework, cloud, or model API

The project can use:

-   any programming language
-   any framework
-   cloud services
-   model APIs

provided the resulting project is actually implemented and demonstrable.

------------------------------------------------------------------------

### 2. Open-source libraries and public datasets

Open-source dependencies and public datasets are allowed.

For this P-02 project, data must still comply with the explicit
restriction against real personal/patient data.

------------------------------------------------------------------------

### 3. AI coding assistants

AI coding assistants are explicitly allowed.

The rules require that their use be **declared in the README**.

This repository should therefore contain a README section such as:

``` markdown
## AI Assistance Disclosure

AI coding assistants were used during development.
They were used for implementation assistance, debugging,
refactoring, documentation, and code review support.

All submitted code was reviewed and validated by the participant.
```

Only state tools that were actually used.

------------------------------------------------------------------------

### 4. Boilerplate written before today

Previously written boilerplate is allowed.

Do not misrepresent old code as being created during the event.

------------------------------------------------------------------------

### 5. Asking for help

The rules explicitly allow asking:

-   your mentor
-   the floor team
-   your pod

for help.

------------------------------------------------------------------------

# 18. OFFICIAL RULES --- NOT ALLOWED

The rules slide lists the following disqualifying behaviors.

## 1. Submitting work somebody else built

Do not submit another person's implementation as your own.

------------------------------------------------------------------------

## 2. Reskinning an existing project for a track

The rules explicitly disallow:

> **An existing project re-skinned for a track**

This is especially important for our ArogyaPlus starting point.

### Important project-development rule

We may reuse legitimate existing code/boilerplate where permitted, but
the submitted system must represent a genuine implementation of P-02.

We must not simply:

``` text
Old ArogyaPlus
    ↓
Change colors
    ↓
Rename buttons
    ↓
Call it enterprise RAG
```

That would directly conflict with the rule.

The transformation must be substantive and demonstrable:

``` text
Existing healthcare frontend foundation
            ↓
New P-02 architecture
            ↓
Enterprise corpus ingestion
            ↓
Retrieval engine
            ↓
Authorization
            ↓
Conflict handling
            ↓
Citation system
            ↓
Refusal
            ↓
Evaluation
```

The README should transparently describe reused foundations and new
work.

------------------------------------------------------------------------

## 3. Video showing something the code cannot do

The demo video must reflect the actual submitted implementation.

Do not:

-   fake UI
-   pre-render an impossible result
-   edit a video to imply functionality that does not exist
-   show a prototype feature absent from the repository

Every important demo claim should be reproducible from the submitted
code.

------------------------------------------------------------------------

## 4. Real personal or patient data

The rules explicitly prohibit:

> **Real personal or patient data, from any source**

Therefore:

``` text
NO
Real patient records
Real medical reports
Real names
Real phone numbers
Real addresses
Real hospital patient identifiers
```

Use synthetic/de-identified data only.

For demo data, explicitly label it as synthetic where appropriate.

------------------------------------------------------------------------

## 5. Security testing outside your own sandbox

Do not perform security testing against external systems or systems you
do not own/control.

Security demonstrations must remain within:

-   the local project
-   the provided sandbox
-   intentionally created test data
-   systems explicitly under our control

For example, test authorization using our own synthetic users/documents.

------------------------------------------------------------------------

## 6. Missing the submission deadline

Missing the **15:30 submission deadline** is listed as disqualifying.

Treat this as a hard deadline.

------------------------------------------------------------------------

# 19. P-02 PRODUCT PHILOSOPHY

The core principle should be:

> **Evidence before generation.**

The system should optimize for:

``` text
Can we prove the answer?
        ↓
Is the user allowed to see the evidence?
        ↓
Do sources agree?
        ↓
Is the evidence sufficient?
        ↓
Can the answer be traced?
```

Not simply:

``` text
Can the LLM produce a fluent answer?
```

------------------------------------------------------------------------

# 20. REAL-WORLD PROBLEM WE ARE SOLVING

A healthcare organization may have thousands of documents:

``` text
Clinical Guidelines
SOPs
Formularies
Payer Policies
Device Manuals
Operational Records
Tables
Old Versions
New Versions
```

A user may ask:

> "What is the current protocol for X?"

A naive workflow requires the user to:

``` text
Search document repository
      ↓
Open multiple documents
      ↓
Search within PDFs
      ↓
Compare versions
      ↓
Determine which policy is active
      ↓
Determine whether they are allowed to see it
      ↓
Make a decision
```

A naive chatbot creates another failure mode:

``` text
Question
   ↓
LLM
   ↓
Confident answer
   ↓
Unknown source
   ↓
Potentially outdated or unsupported decision
```

P-02 asks us to build the controlled alternative:

``` text
Question
   ↓
Authorized retrieval
   ↓
Evidence
   ↓
Conflict/version analysis
   ↓
Grounded answer OR refusal
   ↓
Exact citation
   ↓
Audit trail
```

------------------------------------------------------------------------

# 21. TARGET SYSTEM ARCHITECTURE

The conceptual architecture is:

``` text
                    ┌───────────────────┐
                    │   Clinical / Ops  │
                    │       User        │
                    └─────────┬─────────┘
                              │
                           Question
                              │
                    ┌─────────▼─────────┐
                    │   Query Service   │
                    └─────────┬─────────┘
                              │
                  ┌───────────┴───────────┐
                  │                       │
             Lexical Search          Dense Search
                (BM25)              (Embeddings)
                  │                       │
                  └───────────┬───────────┘
                              │
                       Hybrid Fusion
                              │
                           Reranker
                              │
                    Permission Filtering
                              │
                    Evidence Validation
                    ┌─────────┼─────────┐
                    │         │         │
                Sufficient  Conflict  Missing
                    │         │         │
                    │      Surface     Refuse
                    │      Conflict    /Escalate
                    │         │         │
                    └────┬────┴─────────┘
                         │
                   Grounded Answer
                         │
                    Citation Mapping
                         │
                    Audit / Trace
```

This is a target architecture, not a requirement to use these exact
libraries.

------------------------------------------------------------------------

# 22. DOCUMENT INGESTION ARCHITECTURE

Target flow:

``` text
PDF / DOCX / CSV / XLSX
          ↓
      File Parser
          ↓
      Normalization
          ↓
      Structure Detection
          ↓
       Chunking
          ↓
       Metadata
          ↓
     Embeddings + Index
```

Metadata should preserve information such as:

``` text
document_id
document_type
document_title
version
status
effective_from
effective_to
department
allowed_roles
page
section
table_id
row_id
chunk_id
```

------------------------------------------------------------------------

# 23. RETRIEVAL ARCHITECTURE

Preferred direction:

``` text
Question
   ↓
 ┌─────────────────────┐
 │                     │
BM25                Dense
 │                     │
 └──────────┬──────────┘
            ↓
     Hybrid Fusion
            ↓
         Reranker
            ↓
    Permission Filter
            ↓
       Top Evidence
```

The exact ordering of security filtering must ensure that unauthorized
evidence cannot reach the model.

------------------------------------------------------------------------

# 24. CITATION ARCHITECTURE

Target:

``` text
Answer claim
     ↓
Evidence ID
     ↓
Chunk
     ↓
Document
     ↓
Page / Section / Table / Row / Clause
```

Example:

``` text
The active policy requires Procedure B. [1]

[1] Hospital Policy 2026
    Page 14
    Section 3.2
    Open evidence →
```

The citation must point to actual evidence.

------------------------------------------------------------------------

# 25. CONFLICT ARCHITECTURE

Example corpus:

``` text
clinical_guideline_2024.pdf
    status: superseded

hospital_policy_2026.pdf
    status: active
```

If they disagree:

``` text
Question
   ↓
Retrieve both
   ↓
Detect disagreement
   ↓
Check lifecycle metadata
   ↓
Surface evidence
   ↓
Explain status
```

Never silently erase the disagreement.

------------------------------------------------------------------------

# 26. REFUSAL ARCHITECTURE

The system should have an explicit evidence sufficiency decision.

Conceptually:

``` text
Question
   ↓
Retrieve
   ↓
Evidence quality
   ↓
 ┌───────────────┐
 │               │
Enough         Not enough
 │               │
 ↓               ↓
Answer        Refuse
 + citation    + missing evidence
```

A refusal is a valid product outcome.

------------------------------------------------------------------------

# 27. SECURITY ARCHITECTURE

The security boundary must exist before model context construction.

Preferred:

``` text
Request
  ↓
Authenticate
  ↓
Identify role
  ↓
Apply document/chunk permissions
  ↓
Retrieve only allowed evidence
  ↓
Build model context
  ↓
Generate
```

Not:

``` text
Retrieve all
  ↓
Build model context
  ↓
LLM sees everything
  ↓
Frontend hides restricted sources
```

------------------------------------------------------------------------

# 28. PRIVACY ARCHITECTURE

Use only synthetic/de-identified data.

Potential controls:

``` text
Input
 ↓
Identifier detection
 ↓
Redaction / rejection
 ↓
Retrieval
 ↓
Generation
 ↓
Output scan
 ↓
Final response
```

Tests should include synthetic identifiers designed to verify that they
do not leak.

------------------------------------------------------------------------

# 29. EVALUATION STRATEGY

A useful P-02 benchmark can contain categories such as:

``` text
5 normal questions
5 multi-document questions
5 conflict questions
5 unanswerable questions
5 authorization questions
5 citation/provenance questions
```

The exact number is flexible.

Potential metrics:

### Retrieval

-   Recall@K
-   relevant evidence retrieval rate

### Citation

-   citation correctness
-   citation completeness

### Grounding

-   claim-to-evidence support rate

### Refusal

-   correct refusal rate
-   unsupported-answer rate

### Security

-   unauthorized retrieval rate

The most important rule:

> **Never report a metric unless the repository contains the evaluation
> data/method used to calculate it.**

------------------------------------------------------------------------

# 30. DEMO SCENARIOS

The demo should be designed around the scoring rubric.

## Demo 1 --- Normal question

Judge enters a new question.

System:

``` text
retrieves evidence
→ answers
→ cites exact source
```

------------------------------------------------------------------------

## Demo 2 --- Citation inspection

Click citation.

System opens:

``` text
document
page
section
exact evidence
```

------------------------------------------------------------------------

## Demo 3 --- Conflict

Ask a question where two synthetic documents intentionally disagree.

System:

``` text
⚠ Conflict detected

Source A → claim A
Source B → claim B

Version/status:
...
```

------------------------------------------------------------------------

## Demo 4 --- Insufficient evidence

Ask something absent from the corpus.

System:

``` text
Insufficient evidence.

Missing:
...
```

No hallucinated answer.

------------------------------------------------------------------------

## Demo 5 --- Access control

Use two synthetic users with different permissions.

``` text
User A
  → allowed document

User B
  → document unavailable
```

Verify that unauthorized evidence is not simply hidden in the UI.

------------------------------------------------------------------------

## Demo 6 --- Table-heavy retrieval

Ask a question whose answer exists in a table.

Show:

``` text
table
row
column
value
citation
```

------------------------------------------------------------------------

## Demo 7 --- Evaluation

Show the actual benchmark and measured results.

------------------------------------------------------------------------

# 31. AROGYAPLUS STARTING POINT

An existing ArogyaPlus codebase may provide a healthcare UI foundation.

However, the hackathon rule explicitly prohibits:

> an existing project re-skinned for a track.

Therefore the implementation must be a substantive P-02 system, not a
visual rebranding.

If existing code is reused, the repository should clearly distinguish:

``` text
Existing foundation
        ↓
New P-02 implementation
        ↓
New retrieval/security/evaluation capabilities
```

The submitted system must genuinely implement P-02.

------------------------------------------------------------------------

# 32. AI CODING ASSISTANT POLICY

AI coding assistants are allowed by the event rules, provided their use
is declared in the README.

Therefore AI agents such as:

-   Claude Code
-   Codex
-   other coding assistants

may assist with:

-   implementation
-   debugging
-   refactoring
-   tests
-   documentation
-   architecture analysis

The repository must contain an accurate AI assistance disclosure.

Do not claim an AI tool was used if it was not.

------------------------------------------------------------------------

# 33. AI AGENT DEVELOPMENT RULES

Claude Code / Codex working on this repository MUST follow these rules.

## Rule 1 --- Read the problem first

Before implementing P-02 functionality, understand:

``` text
problem.md
```

and the requirement mapping.

------------------------------------------------------------------------

## Rule 2 --- Inspect before modifying

Do not assume what existing code does.

Before changing a module:

1.  inspect it
2.  understand its dependencies
3.  identify affected requirements
4.  implement
5.  test

------------------------------------------------------------------------

## Rule 3 --- Do not fake functionality

Never create:

-   hardcoded answers
-   fake citations
-   fake retrieval
-   fake metrics
-   fake security
-   fake confidence
-   fake evaluation results

unless clearly isolated as test fixtures and documented as such.

------------------------------------------------------------------------

## Rule 4 --- No unsupported claims

Do not tell the user:

> "This satisfies P-02"

unless the relevant behavior has actually been implemented and verified.

------------------------------------------------------------------------

## Rule 5 --- Tests are evidence

Important requirements should have corresponding tests where practical.

Examples:

``` text
test_unauthorized_document_is_not_retrieved
test_conflict_is_detected
test_unanswerable_question_is_refused
test_citation_points_to_correct_evidence
test_identifier_does_not_leak
```

------------------------------------------------------------------------

## Rule 6 --- Security before UI

Security must not depend on frontend visibility.

------------------------------------------------------------------------

## Rule 7 --- Preserve provenance

Every retrieved unit should retain enough metadata for citation.

------------------------------------------------------------------------

## Rule 8 --- No silent conflict resolution

Do not make conflicting sources appear consistent.

------------------------------------------------------------------------

## Rule 9 --- No real patient data

Only synthetic/de-identified data.

------------------------------------------------------------------------

## Rule 10 --- Keep the system demonstrable

Every major feature should be usable in a live demo.

------------------------------------------------------------------------

# 34. AI CODE-REVIEW CHECKLIST

Before declaring the repository complete, an AI reviewer should inspect:

## Problem fit

-   [ ] P-02 is explicitly identified.
-   [ ] Every core requirement has an implementation.
-   [ ] Every major requirement has a verification path.

## Ingestion

-   [ ] Long documents supported.
-   [ ] Short policies supported.
-   [ ] Structured records supported.
-   [ ] Table-heavy source supported.

## Retrieval

-   [ ] Natural-language query works.
-   [ ] Retrieval is real.
-   [ ] Hybrid retrieval implemented if claimed.
-   [ ] Reranking implemented if claimed.

## Grounding

-   [ ] Answers are based on retrieved evidence.
-   [ ] Unsupported claims are prevented or handled.

## Citations

-   [ ] Claims map to evidence.
-   [ ] Evidence is accessible.
-   [ ] Citation metadata is accurate.

## Conflicts

-   [ ] Conflicting sources can be represented.
-   [ ] Conflicts are surfaced.

## Refusal

-   [ ] Insufficient evidence produces refusal/escalation.
-   [ ] Missing evidence is explained.

## Authorization

-   [ ] User identity/role is represented.
-   [ ] Retrieval is permission-aware.
-   [ ] Unauthorized chunks do not reach the model.

## Privacy

-   [ ] No real patient data.
-   [ ] Synthetic/de-identified data is used.
-   [ ] Leakage tests exist where applicable.

## Freshness

-   [ ] Versions can be represented if implemented.
-   [ ] Supersession/retirement is explicit if implemented.

## Evaluation

-   [ ] Question set exists.
-   [ ] Evaluation is reproducible.
-   [ ] Metrics come from actual runs.

## Demo

-   [ ] New judge input works.
-   [ ] Core scenarios are demonstrable.
-   [ ] Video reflects actual code.

## Submission

-   [ ] Public repository works.
-   [ ] README exists.
-   [ ] AI assistance is disclosed.
-   [ ] No prohibited data.
-   [ ] Submission completed before deadline.

------------------------------------------------------------------------

# 35. REPOSITORY DOCUMENTATION EXPECTATION

Recommended project documentation:

``` text
/
├── README.md
├── AGENTS.md
├── CLAUDE.md
├── problem.md
│
└── docs/
    ├── REQUIREMENTS.md
    ├── ARCHITECTURE.md
    ├── EXISTING_CODEBASE.md
    ├── IMPLEMENTATION.md
    ├── DATA_MODEL.md
    ├── RETRIEVAL.md
    ├── SECURITY.md
    ├── CITATIONS.md
    ├── CONFLICTS.md
    ├── EVALUATION.md
    ├── TESTING.md
    ├── API.md
    ├── UI_UX.md
    └── DEMO.md
```

These files should not contradict each other.

When implementation changes, update the relevant documentation.

------------------------------------------------------------------------

# 36. FINAL ENGINEERING PRINCIPLE

The project should be optimized around:

> **"If the system cannot prove why an answer is allowed to exist, it
> should not confidently produce that answer."**

The desired system is not simply:

``` text
Healthcare chatbot
```

It is:

``` text
Healthcare Enterprise Knowledge System

        ↓

Authorized Retrieval

        ↓

Evidence

        ↓

Conflict / Version Awareness

        ↓

Grounded Answer OR Refusal

        ↓

Precise Citation

        ↓

Auditability

        ↓

Measured Quality
```

------------------------------------------------------------------------

# 37. FINAL REVIEW QUESTION

Before submission, the team/AI should be able to answer:

> **Can a judge type a question the system has never seen, and can the
> system retrieve authorized evidence, produce a grounded answer with
> exact citations, surface conflicts, refuse unsupported questions, and
> demonstrate the behavior from the submitted code?**

If the answer is not demonstrably yes, the implementation is not
finished.

------------------------------------------------------------------------

# 38. SOURCES / CONTEXT ORIGIN

This document consolidates:

1.  Official Velloe Escape Velocity Hackathon 1.0 event information:
    https://velloe.tech/escape-velocity

2.  Participant-provided P-02 problem statement from the Velloe portal.

3.  Participant-provided scoring slide:

    -   Working demo --- 30%
    -   Problem fit --- 20%
    -   Technical depth --- 20%
    -   Originality --- 15%
    -   Communication --- 15%

4.  Participant-provided rules slide:

    -   Allowed technologies and AI assistants
    -   Open-source libraries/public datasets
    -   AI coding assistant disclosure
    -   Previously written boilerplate
    -   Mentor/floor/pod assistance
    -   Disqualifying behaviors
    -   15:30 submission deadline

5.  Assigned mentor information provided by the participant.

------------------------------------------------------------------------

# 39. SOURCE-OF-TRUTH PRIORITY

When information conflicts, use this priority:

``` text
1. Official event rules / organizer instructions
        ↓
2. Assigned P-02 problem statement
        ↓
3. Official Velloe event page
        ↓
4. Project documentation
        ↓
5. AI inference / implementation preference
```

AI agents must never override an explicit organizer requirement with
their own assumption.

If a requirement is unclear, flag it instead of inventing a rule.

------------------------------------------------------------------------

# 40. STATUS

**Assigned Track:** P-02\
**Problem:** Healthcare Greenfield Enterprise RAG\
**Build mode:** Solo\
**Event date:** September 26, 2026\
**Submission deadline:** 15:30\
**Primary scoring focus:** Working demo + exact problem fit + real
technical depth\
**Data restriction:** Synthetic/de-identified only\
**AI coding assistants:** Allowed, but disclose use in README\
**Repository requirement:** Public GitHub submission\
**Core principle:** Evidence before generation
