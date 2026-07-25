#!/usr/bin/env python3
"""Validate a UI/UX developer handoff JSON file.

This is a lightweight structural validator. It does not require third-party
packages and is intended to catch common handoff issues before the development
skill consumes the UX output.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Iterable

REQUIRED_TOP_LEVEL = [
    "version",
    "product",
    "scope",
    "platforms",
    "roles",
    "requirements",
    "flows",
    "screens",
    "components",
    "global_accessibility",
    "acceptance_criteria",
]

REQUIRED_SCREEN_FIELDS = [
    "id",
    "name",
    "purpose",
    "user_goal",
    "entry_points",
    "exit_points",
    "primary_action",
    "components",
    "states",
    "accessibility",
    "requirement_ids",
    "acceptance_criteria",
]

REQUIRED_FLOW_FIELDS = [
    "id",
    "name",
    "actor_role_id",
    "trigger",
    "entry_screen_id",
    "steps",
]

REQUIRED_STEP_FIELDS = [
    "order",
    "screen_id",
    "user_action",
    "system_response",
    "next_screen_id",
    "requirement_ids",
]

RECOMMENDED_STATES = {"default", "loading", "empty", "error", "success"}


def _ids(items: Iterable[dict[str, Any]], label: str, errors: list[str]) -> set[str]:
    seen: set[str] = set()
    for i, item in enumerate(items):
        item_id = item.get("id")
        if not item_id:
            errors.append(f"{label}[{i}] is missing id")
            continue
        if item_id in seen:
            errors.append(f"Duplicate {label} id: {item_id}")
        seen.add(item_id)
    return seen


def _require_fields(obj: dict[str, Any], fields: list[str], path: str, errors: list[str]) -> None:
    for field in fields:
        if field not in obj:
            errors.append(f"{path} missing required field: {field}")
        elif obj[field] in (None, "", []):
            errors.append(f"{path}.{field} is empty")


def validate(data: dict[str, Any]) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    _require_fields(data, REQUIRED_TOP_LEVEL, "$", errors)

    roles = data.get("roles", []) or []
    requirements = data.get("requirements", []) or []
    flows = data.get("flows", []) or []
    screens = data.get("screens", []) or []
    components = data.get("components", []) or []
    acs = data.get("acceptance_criteria", []) or []

    if not isinstance(flows, list):
        errors.append("$.flows must be a list")
        flows = []
    if not isinstance(screens, list):
        errors.append("$.screens must be a list")
        screens = []

    role_ids = _ids(roles, "roles", errors) if isinstance(roles, list) else set()
    req_ids = _ids(requirements, "requirements", errors) if isinstance(requirements, list) else set()
    flow_ids = _ids(flows, "flows", errors)
    screen_ids = _ids(screens, "screens", errors)
    component_ids = _ids(components, "components", errors) if isinstance(components, list) else set()
    ac_ids = _ids(acs, "acceptance_criteria", errors) if isinstance(acs, list) else set()

    referenced_screens: set[str] = set()
    referenced_requirements: set[str] = set()
    referenced_components: set[str] = set()
    referenced_acs: set[str] = set()

    for flow in flows:
        flow_id = flow.get("id", "<unknown-flow>")
        _require_fields(flow, REQUIRED_FLOW_FIELDS, f"flow {flow_id}", errors)

        actor_role_id = flow.get("actor_role_id")
        if actor_role_id and actor_role_id not in role_ids:
            errors.append(f"flow {flow_id} references missing role {actor_role_id}")

        entry_screen = flow.get("entry_screen_id")
        if entry_screen:
            referenced_screens.add(entry_screen)
            if entry_screen not in screen_ids:
                errors.append(f"flow {flow_id} entry_screen_id references missing screen {entry_screen}")

        steps = flow.get("steps", []) or []
        if not isinstance(steps, list):
            errors.append(f"flow {flow_id}.steps must be a list")
            continue
        seen_orders: set[int] = set()
        for idx, step in enumerate(steps):
            _require_fields(step, REQUIRED_STEP_FIELDS, f"flow {flow_id}.steps[{idx}]", errors)
            order = step.get("order")
            if isinstance(order, int):
                if order in seen_orders:
                    errors.append(f"flow {flow_id} has duplicate step order {order}")
                seen_orders.add(order)
            sid = step.get("screen_id")
            if sid:
                referenced_screens.add(sid)
                if sid not in screen_ids:
                    errors.append(f"flow {flow_id} step {order} references missing screen {sid}")
            next_sid = step.get("next_screen_id")
            if next_sid:
                referenced_screens.add(next_sid)
                if next_sid not in screen_ids:
                    errors.append(f"flow {flow_id} step {order} references missing next screen {next_sid}")
            for rid in step.get("requirement_ids", []) or []:
                referenced_requirements.add(rid)
                if rid not in req_ids:
                    errors.append(f"flow {flow_id} step {order} references missing requirement {rid}")

        if len(steps) == 1:
            warnings.append(f"flow {flow_id} has only one step; verify this is intentional")

    terminal_screen_ids = {step.get("next_screen_id") for flow in flows for step in (flow.get("steps", []) or []) if step.get("next_screen_id") is None}

    for screen in screens:
        sid = screen.get("id", "<unknown-screen>")
        _require_fields(screen, REQUIRED_SCREEN_FIELDS, f"screen {sid}", errors)

        states = set(screen.get("states", []) or [])
        if "default" not in states:
            warnings.append(f"screen {sid} does not list a default state")
        primary_label = ""
        if isinstance(screen.get("primary_action"), dict):
            primary_label = str(screen.get("primary_action", {}).get("label", "")).lower()
        risk_action_terms = ("submit", "continue", "save", "upload", "delete", "approve", "reject", "pay", "send", "confirm")
        needs_error_state = bool(
            screen.get("data_inputs")
            or screen.get("validations")
            or screen.get("api_or_data_dependencies")
            or any(term in primary_label for term in risk_action_terms)
        )
        if needs_error_state and not (states & {"error", "validation_error", "system_error"}):
            warnings.append(f"screen {sid} likely needs an error or validation_error state")
        if screen.get("data_inputs") and not screen.get("validations"):
            warnings.append(f"screen {sid} has data_inputs but no validations")

        entry_points = screen.get("entry_points", []) or []
        exit_points = screen.get("exit_points", []) or []
        if not entry_points:
            warnings.append(f"screen {sid} has no entry_points")
        if not exit_points and sid not in terminal_screen_ids:
            warnings.append(f"screen {sid} has no exit_points and is not clearly terminal")

        for rid in screen.get("requirement_ids", []) or []:
            referenced_requirements.add(rid)
            if rid not in req_ids:
                errors.append(f"screen {sid} references missing requirement {rid}")
        for cid in screen.get("components", []) or []:
            referenced_components.add(cid)
            if cid not in component_ids:
                errors.append(f"screen {sid} references missing component {cid}")
        for acid in screen.get("acceptance_criteria", []) or []:
            referenced_acs.add(acid)
            if acid not in ac_ids:
                errors.append(f"screen {sid} references missing acceptance criterion {acid}")

        accessibility = screen.get("accessibility", {}) or {}
        if isinstance(accessibility, dict) and not any(k in accessibility for k in ("focus_order", "notes", "announcements")):
            warnings.append(f"screen {sid} accessibility notes are too generic; add focus_order, notes, or announcements")

    for component in components if isinstance(components, list) else []:
        cid = component.get("id", "<unknown-component>")
        for sid in component.get("used_on_screen_ids", []) or []:
            if sid not in screen_ids:
                errors.append(f"component {cid} references missing screen {sid}")
        if not component.get("accessibility_notes"):
            warnings.append(f"component {cid} has no accessibility_notes")

    for ac in acs if isinstance(acs, list) else []:
        acid = ac.get("id", "<unknown-ac>")
        sid = ac.get("screen_id")
        fid = ac.get("flow_id")
        if sid and sid not in screen_ids:
            errors.append(f"acceptance criterion {acid} references missing screen {sid}")
        if fid and fid not in flow_ids:
            errors.append(f"acceptance criterion {acid} references missing flow {fid}")
        for rid in ac.get("requirement_ids", []) or []:
            if rid not in req_ids:
                errors.append(f"acceptance criterion {acid} references missing requirement {rid}")
        if not ac.get("statement"):
            errors.append(f"acceptance criterion {acid} has no statement")

    orphan_screens = screen_ids - referenced_screens
    if orphan_screens:
        warnings.append("Screens not referenced by flows: " + ", ".join(sorted(orphan_screens)))

    unhandled_reqs = req_ids - referenced_requirements
    if unhandled_reqs:
        warnings.append("Requirements not referenced by flows/screens/ACs: " + ", ".join(sorted(unhandled_reqs)))

    unused_components = component_ids - referenced_components
    if unused_components:
        warnings.append("Components not referenced by screens: " + ", ".join(sorted(unused_components)))

    unreferenced_acs = ac_ids - referenced_acs
    if unreferenced_acs:
        warnings.append("Acceptance criteria not referenced by screens: " + ", ".join(sorted(unreferenced_acs)))

    global_a11y = data.get("global_accessibility", {}) or {}
    for key in ["standard", "keyboard", "focus", "color_contrast", "screen_reader", "touch_targets", "error_handling"]:
        if not global_a11y.get(key):
            warnings.append(f"global_accessibility.{key} is missing or empty")

    # Visual design system (optional but expected for user-facing deliverables).
    # These are warnings only, so handoffs without a visual layer still pass.
    design_system = data.get("design_system")
    if not design_system:
        warnings.append(
            "no design_system block: tokens (color/typography/spacing/radius/elevation/motion) "
            "are expected for any user-facing, visually-designed deliverable"
        )
    elif isinstance(design_system, dict):
        for group in ["color", "typography", "spacing", "radius", "elevation", "motion"]:
            if not design_system.get(group):
                warnings.append(f"design_system.{group} is missing or empty")
        if not design_system.get("aesthetic_direction"):
            warnings.append("design_system.aesthetic_direction is missing; state the chosen direction and why")
        themes = design_system.get("themes") or []
        color = design_system.get("color") or {}
        # If dark theme is declared, spot-check that color roles actually provide dark values.
        if isinstance(themes, list) and "dark" in themes and isinstance(color, dict):
            missing_dark = [
                role for role, val in color.items()
                if isinstance(val, dict) and "dark" not in val
            ]
            if missing_dark:
                warnings.append(
                    "design_system declares a dark theme but these color roles lack a dark value: "
                    + ", ".join(sorted(missing_dark))
                )

    return errors, warnings


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: validate_handoff.py path/to/handoff.json", file=sys.stderr)
        return 2

    path = Path(sys.argv[1])
    if not path.exists():
        print(f"File not found: {path}", file=sys.stderr)
        return 2

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        print(f"Invalid JSON: {exc}", file=sys.stderr)
        return 1

    if not isinstance(data, dict):
        print("Handoff root must be a JSON object", file=sys.stderr)
        return 1

    errors, warnings = validate(data)

    if errors:
        print("ERRORS:")
        for err in errors:
            print(f"- {err}")
    if warnings:
        print("WARNINGS:")
        for warn in warnings:
            print(f"- {warn}")

    if not errors and not warnings:
        print("Handoff validation passed with no warnings.")
    elif not errors:
        print("Handoff validation passed with warnings.")

    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
