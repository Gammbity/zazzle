"""
JSON Schemas for Draft.editor_state and Draft.text_layers.

Enforced at the serializer boundary. Existing rows aren't retroactively
validated — migrating legacy data is a separate backfill task.

The schemas are intentionally lenient (additionalProperties allowed) so the
frontend can extend without a backend deploy, but every *required* field is
explicit. If the editor adds new concepts (e.g. image layers on Draft itself
rather than DraftAsset), update here first.
"""
from __future__ import annotations

from typing import Any


TEXT_LAYERS_SCHEMA: dict[str, Any] = {
    '$schema': 'https://json-schema.org/draft/2020-12/schema',
    'type': 'array',
    'items': {
        'type': 'object',
        'required': ['id', 'text', 'x', 'y'],
        'properties': {
            'id': {'type': 'string', 'minLength': 1, 'maxLength': 128},
            'text': {'type': 'string', 'maxLength': 5000},
            'x': {'type': 'number'},
            'y': {'type': 'number'},
            'font_size': {'type': 'number', 'minimum': 1, 'maximum': 1000},
            'font_family': {'type': 'string', 'maxLength': 128},
            'color': {'type': 'string', 'pattern': '^#([0-9a-fA-F]{3}){1,2}$'},
            'rotation': {'type': 'number'},
            'bold': {'type': 'boolean'},
            'italic': {'type': 'boolean'},
            'alignment': {'enum': ['left', 'center', 'right', 'justify']},
            'z_index': {'type': 'integer'},
        },
        'additionalProperties': True,
    },
    'maxItems': 200,
}

EDITOR_STATE_SCHEMA: dict[str, Any] = {
    '$schema': 'https://json-schema.org/draft/2020-12/schema',
    'type': 'object',
    'properties': {
        'zoom': {'type': 'number', 'minimum': 0.01, 'maximum': 100},
        'pan_x': {'type': 'number'},
        'pan_y': {'type': 'number'},
        'selected_layer': {'type': ['string', 'null']},
        'canvas': {
            'type': 'object',
            'properties': {
                'width': {'type': 'number', 'minimum': 1},
                'height': {'type': 'number', 'minimum': 1},
                'background': {'type': 'string'},
            },
            'additionalProperties': True,
        },
        'history': {'type': 'array', 'maxItems': 500},
    },
    'additionalProperties': True,
}
