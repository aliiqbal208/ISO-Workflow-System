"""Shared helpers for route handlers."""

from bson import ObjectId
from bson.errors import InvalidId
from flask import jsonify


def safe_object_id(value: str) -> ObjectId:
    """Convert a string to ObjectId, raising a ValueError if invalid."""
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise ValueError(f"Invalid ID format: {value}")


def serialize_doc(doc: dict) -> dict:
    """Return a copy of a Mongo document with _id converted to string.
    Does NOT mutate the original document."""
    if doc is None:
        return None
    out = {**doc}
    if "_id" in out:
        out["_id"] = str(out["_id"])
    return out
