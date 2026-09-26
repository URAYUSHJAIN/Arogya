"""Role-based access control, enforced server-side inside the retrieval path.

ROLE_POLICY is the organisation's access policy. It is seeded into the
`roles` / `permissions` tables; every authorization decision at query time is
read back from PostgreSQL (`document_permissions`), never from the client.
"""
from __future__ import annotations

from dataclasses import dataclass

import database as db

CATEGORY_LABELS = {
    "clinical_guideline": "Guidelines",
    "sop": "SOPs",
    "formulary": "Formulary",
    "payer_policy": "Payer Policies",
    "device_manual": "Device Manuals",
    "audit_record": "Restricted Audit Records",
}

ROLE_POLICY: dict[str, dict] = {
    "Physician": {
        "description": "Attending / resident clinician",
        "categories": ["clinical_guideline", "sop", "formulary", "payer_policy", "device_manual"],
    },
    "Nurse": {
        "description": "Registered nurse",
        "categories": ["clinical_guideline", "sop", "formulary", "device_manual"],
    },
    "Pharmacist": {
        "description": "Clinical pharmacist",
        "categories": ["clinical_guideline", "formulary", "payer_policy"],
    },
    "Billing Specialist": {
        "description": "Revenue-cycle / claims specialist",
        "categories": ["formulary", "payer_policy"],
    },
    "Compliance Auditor": {
        "description": "Quality & compliance auditor with restricted-record access",
        "categories": list(CATEGORY_LABELS.keys()),
    },
}

VALID_ROLES = tuple(ROLE_POLICY.keys())


class AuthorizationError(Exception):
    """Raised when a request names an unknown role or a security invariant fails."""


@dataclass(frozen=True)
class UserContext:
    """Synthetic user context constructed server-side from a validated role."""
    role: str
    user_id: str
    allowed_categories: frozenset[str]
    allowed_document_ids: frozenset[str]


def seed_roles() -> None:
    with db.transaction() as conn:
        for name, spec in ROLE_POLICY.items():
            row = conn.execute(
                """INSERT INTO roles (name, description) VALUES (%s, %s)
                   ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
                   RETURNING id""",
                (name, spec["description"]),
            ).fetchone()
            conn.execute("DELETE FROM permissions WHERE role_id = %s", (row["id"],))
            for category in spec["categories"]:
                conn.execute(
                    "INSERT INTO permissions (role_id, category) VALUES (%s, %s)",
                    (row["id"], category),
                )


def materialise_document_permissions(conn, document_id: str, category: str) -> None:
    """Derive the document ACL from role→category permissions (at ingestion)."""
    conn.execute("DELETE FROM document_permissions WHERE document_id = %s", (document_id,))
    conn.execute(
        """INSERT INTO document_permissions (document_id, role_id)
           SELECT %s, p.role_id FROM permissions p WHERE p.category = %s""",
        (document_id, category),
    )


def validate_role(role: str | None) -> str:
    if not role or role not in VALID_ROLES:
        raise AuthorizationError(f"Unknown role '{role}'. Valid roles: {', '.join(VALID_ROLES)}")
    return role


def build_user_context(role: str | None) -> UserContext:
    """Validate the role and load its grants from PostgreSQL."""
    role = validate_role(role)
    cats = db.fetch_all(
        """SELECT p.category FROM permissions p JOIN roles r ON r.id = p.role_id
           WHERE r.name = %s""",
        (role,),
    )
    docs = db.fetch_all(
        """SELECT dp.document_id FROM document_permissions dp
           JOIN roles r ON r.id = dp.role_id WHERE r.name = %s""",
        (role,),
    )
    return UserContext(
        role=role,
        user_id=f"synthetic-{role.lower().replace(' ', '-')}",
        allowed_categories=frozenset(r["category"] for r in cats),
        allowed_document_ids=frozenset(r["document_id"] for r in docs),
    )


def assert_authorized(ctx: UserContext, evidence: list) -> None:
    """Defence-in-depth check run immediately before model context is built."""
    for item in evidence:
        doc_id = item["document_id"] if isinstance(item, dict) else item.document_id
        if doc_id not in ctx.allowed_document_ids:
            raise AuthorizationError(
                f"SECURITY INVARIANT VIOLATION: {doc_id} is not authorized for {ctx.role}"
            )
