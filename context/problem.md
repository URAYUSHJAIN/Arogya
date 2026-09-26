# P-02 --- Healthcare Greenfield Enterprise RAG

## Problem Context for AI-Assisted Development

> **Important:** This document is the authoritative problem context for
> this project.\
> AI assistants working on this repository must treat the requirements
> below as the source of truth.\
> Do not invent additional challenge requirements, silently remove
> requirements, or claim a requirement is implemented unless the code
> actually demonstrates it.

------------------------------------------------------------------------

## 1. Problem Statement

### P-02

**Healthcare Greenfield Enterprise RAG --- Retrieval a Clinical Team Can
Rely On**

### Background

A healthcare organisation's working knowledge is spread across:

-   clinical guidelines
-   internal SOPs
-   formularies
-   payer policies
-   device manuals
-   operational records

A greenfield deployment has no legacy search layer to inherit and no
curated index to start from --- which is an advantage, because the
retrieval design can be built for the failure modes that matter here.

In this domain a confident wrong answer is more expensive than no answer
at all, and sources routinely contradict each other because they were
written in different years by different committees.

------------------------------------------------------------------------

## 2. Challenge

Build an enterprise retrieval-augmented system for a healthcare
organisation starting from zero:

**ingestion → retrieval → grounding → citation → refusal**

The system must allow a clinical or operations user to interrogate and
audit the organisation's knowledge.

------------------------------------------------------------------------

# 3. Core Requirements

The implementation MUST address every requirement below.

## R1 --- Heterogeneous Corpus Ingestion

The system must ingest a heterogeneous corpus containing:

1.  Long guideline documents
2.  Short policies
3.  Structured records
4.  At least one table-heavy source

The implementation must demonstrate that these different source types
can participate in the retrieval system.

------------------------------------------------------------------------

## R2 --- Natural-Language Question Answering

Users must be able to ask natural-language questions against the
organisation's knowledge.

Answers must be generated from retrieved evidence rather than
unsupported model knowledge.

------------------------------------------------------------------------

## R3 --- Claim-Level Traceability

Every claim in an answer must be traceable to the passage from which it
came.

The source must be accessible in **one click**.

The implementation should preserve enough source metadata to locate the
evidence precisely.

------------------------------------------------------------------------

## R4 --- Conflict Handling

Sources may disagree because they were created:

-   in different years
-   by different committees
-   for different policies or contexts

When retrieved sources disagree, the system must:

-   detect/surface the conflict
-   show the relevant conflicting evidence
-   avoid silently selecting one source as though no disagreement exists

The system must make the disagreement visible to the user.

------------------------------------------------------------------------

## R5 --- Insufficient Evidence / Refusal

When available evidence is insufficient, the system must:

-   refuse to provide an unsupported answer OR escalate the question
-   explicitly state what evidence is missing

The system must not manufacture an answer simply because the language
model can generate one.

------------------------------------------------------------------------

## R6 --- Retrieval-Level Access Boundaries

Not every user may be allowed to see every document.

Access boundaries must be respected **inside the retrieval path**, not
only in the user interface.

Unauthorized documents/evidence must not simply be retrieved and then
hidden by the frontend.

------------------------------------------------------------------------

## R7 --- Synthetic / De-identified Data

The system must use:

-   synthetic data, OR
-   de-identified data

The implementation must demonstrate that identifiers cannot leak into
generated answers.

No real patient-identifying information should be used.

------------------------------------------------------------------------

## R8 --- Quality Measurement

The project must define its own question set, even if small, and measure
system quality against it.

The evaluation must be reproducible enough to demonstrate how the
reported quality was obtained.

------------------------------------------------------------------------

# 4. Advanced Directions

These are advanced directions explicitly identified by the problem
statement and should be considered when designing the implementation.

## A1 --- Hybrid Retrieval

Combine:

-   lexical search
-   dense search

and use reranking.

The goal is to make retrieval robust to both exact terminology and
semantic queries.

------------------------------------------------------------------------

## A2 --- Clinical Document Chunking

Chunking must be designed to survive:

-   clinical tables
-   very long guideline documents
-   documents up to approximately 200 pages

The implementation should preserve useful structural information rather
than treating every document as an arbitrary block of text.

------------------------------------------------------------------------

## A3 --- Fine-Grained Citations

Citation granularity may extend to:

-   passage
-   row
-   clause

The citation system should make it possible to locate the supporting
evidence precisely.

------------------------------------------------------------------------

## A4 --- Retrieval-Level Authorization

Access control may be enforced using:

-   user roles
-   document-level permissions

Authorization must operate inside retrieval.

The model should receive only evidence the requesting user is authorized
to access.

------------------------------------------------------------------------

## A5 --- Groundedness / Hallucination Evaluation

The system may evaluate:

-   groundedness
-   hallucination

and report a measured score.

Any reported score must correspond to an actual evaluation performed by
the project.

------------------------------------------------------------------------

## A6 --- Freshness and Document Lifecycle

The system may support:

-   guideline versioning
-   supersession
-   retirement

The retrieval/answering process should be able to distinguish relevant
document versions and lifecycle states.

------------------------------------------------------------------------

# 5. Required End-to-End Concept

The target system should conceptually implement:

``` text
Documents
    ↓
Ingestion
    ↓
Parsing / Normalization
    ↓
Chunking + Structural Metadata
    ↓
Indexing
    ↓
Retrieval
    ├── Lexical Search
    └── Dense Search
            ↓
        Hybrid Retrieval
            ↓
         Reranking
            ↓
     Access Control Check
            ↓
      Evidence Validation
       ├── Sufficient
       │      ↓
       │   Grounded Answer
       │      ↓
       │    Citations
       │
       ├── Conflicting
       │      ↓
       │   Surface Conflict
       │
       └── Insufficient
              ↓
        Refuse / Escalate
              ↓
        State Missing Evidence
```

This diagram is a conceptual interpretation of the stated requirements,
not an additional mandatory architecture.

------------------------------------------------------------------------

# 6. Core Safety Principle

The problem statement establishes a key principle:

> **A confident wrong answer is more expensive than no answer at all.**

Therefore, the system should prioritize:

1.  Evidence
2.  Retrieval quality
3.  Authorization
4.  Grounding
5.  Traceability
6.  Conflict visibility
7.  Appropriate refusal

over simply producing fluent answers.

------------------------------------------------------------------------

# 7. What the AI Must Optimize For

When modifying or creating code for this project, AI assistants should
evaluate every implementation against the following questions:

### Evidence

-   Where did this answer come from?
-   Can the user open the exact supporting evidence?

### Retrieval

-   Why was this evidence retrieved?
-   Does retrieval support both lexical and semantic queries where
    appropriate?

### Authorization

-   Was the user authorized to access every retrieved piece of evidence?
-   Could unauthorized content reach the model?

### Conflicts

-   What happens when two authoritative-looking sources disagree?
-   Is the disagreement surfaced rather than silently ignored?

### Refusal

-   What happens when there is insufficient evidence?
-   Does the system explain what is missing?

### Privacy

-   Is the corpus synthetic/de-identified?
-   Could an identifier leak into an answer?

### Freshness

-   Can different document versions be distinguished?
-   Can superseded or retired information be identified if the
    implementation supports lifecycle handling?

### Evaluation

-   How is quality measured?
-   Can the reported metrics be reproduced?

------------------------------------------------------------------------

# 8. Implementation Integrity Rules

AI-generated code must follow these rules:

### Rule 1 --- Do not fake requirements

Do not add UI labels such as "secure", "verified", "grounded", or "HIPAA
compliant" unless the underlying implementation supports the claim.

### Rule 2 --- Do not rely only on prompts

Requirements such as authorization, refusal, citations, and privacy
protection should have corresponding application-level logic where
applicable.

### Rule 3 --- Keep security server-side

Anything that determines what evidence a user is allowed to retrieve
must not depend solely on frontend visibility.

### Rule 4 --- Preserve provenance

Documents, chunks, tables, rows, clauses, and passages should retain
enough metadata to support traceable citations.

### Rule 5 --- Do not silently resolve conflicts

If evidence conflicts, the system must make the conflict visible rather
than pretending the evidence agrees.

### Rule 6 --- Do not claim evaluation without evidence

If the project reports a retrieval, groundedness, hallucination,
citation, refusal, or other score, the repository should contain the
evaluation questions, methodology, and/or generated result needed to
understand how the score was obtained.

### Rule 7 --- Synthetic/de-identified data only

Development and demonstration data must remain synthetic or
de-identified.

### Rule 8 --- Prefer explicit, testable behavior

Critical requirements should have tests or other demonstrable
verification wherever practical.

------------------------------------------------------------------------

# 9. Definition of Success

A successful implementation is not merely a chatbot that answers
healthcare questions.

It is an **auditable enterprise retrieval system** that demonstrates:

``` text
Heterogeneous ingestion
        +
Reliable retrieval
        +
Authorization
        +
Evidence grounding
        +
Precise citations
        +
Conflict visibility
        +
Safe refusal
        +
Privacy protection
        +
Measured quality
```

The final implementation should make it easy for a reviewer to map each
P-02 requirement to:

``` text
Requirement
    ↓
Implementation
    ↓
Test / Demonstration
    ↓
Evidence
```

------------------------------------------------------------------------

# 10. Requirement Traceability

Maintain a requirement-to-implementation mapping in the repository.

Recommended format:

  -----------------------------------------------------------------------------------------
  ID                Requirement               Implementation              Verification
  ----------------- ------------------------- --------------------------- -----------------
  R1                Heterogeneous corpus      Ingestion/parsing pipeline  Ingestion tests +
                                                                          demo corpus

  R2                Natural-language QA       Query + answer pipeline     End-to-end QA

  R3                Claim traceability        Citation/provenance system  Citation tests

  R4                Conflict handling         Conflict detection +        Conflict scenario
                                              evidence presentation       

  R5                Refusal/escalation        Evidence                    Unanswerable
                                              sufficiency/refusal logic   questions

  R6                Retrieval-level access    Permission-aware retrieval  Access-control
                                                                          tests

  R7                Synthetic/de-identified   Sanitized demo corpus +     Privacy test
                    data                      leakage checks              

  R8                Quality measurement       Evaluation question set +   Evaluation report
                                              metrics                     

  A1                Hybrid retrieval          Lexical + dense + reranking Retrieval
                                                                          evaluation

  A2                Robust chunking           Structural/table/document   Chunking tests
                                              chunking                    

  A3                Fine-grained citations    Passage/row/clause          Citation
                                              provenance                  inspection

  A4                Role/document             Retrieval authorization     RBAC tests
                    authorization             layer                       

  A5                Groundedness evaluation   Evaluation pipeline         Reported measured
                                                                          score

  A6                Version/freshness         Version/supersession        Versioning
                                              lifecycle                   scenarios
  -----------------------------------------------------------------------------------------

------------------------------------------------------------------------

# 11. AI Development Instruction

Before implementing any feature, determine:

1.  Which P-02 requirement does it satisfy?
2.  What real failure mode does it address?
3.  Where is the implementation located?
4.  How can it be tested?
5.  How can a reviewer verify that it actually works?

If a feature cannot be connected to the problem statement, avoid adding
it merely for complexity or visual appeal.

The goal is not to build the largest system.

The goal is to build a system whose implementation clearly demonstrates
that the P-02 requirements have been solved.
