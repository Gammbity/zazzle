"""
Logging filter + JSON formatter.

`RequestIDFilter` injects the current request ID into every LogRecord so
formatters can include it. `JSONFormatter` produces one structured line per
record — parseable by Loki/Datadog/CloudWatch without extra glue.
"""
import json
import logging
from contextvars import ContextVar
from datetime import datetime, timezone

request_id_ctx: ContextVar[str] = ContextVar('request_id', default='-')


class RequestIDFilter(logging.Filter):
    def filter(self, record):
        record.request_id = request_id_ctx.get()
        return True


_RESERVED = {
    'args', 'asctime', 'created', 'exc_info', 'exc_text', 'filename',
    'funcName', 'levelname', 'levelno', 'lineno', 'message', 'module',
    'msecs', 'msg', 'name', 'pathname', 'process', 'processName',
    'relativeCreated', 'stack_info', 'thread', 'threadName', 'request_id',
}


class JSONFormatter(logging.Formatter):
    def format(self, record):
        if not hasattr(record, 'request_id'):
            record.request_id = request_id_ctx.get()

        payload = {
            'ts': datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'request_id': record.request_id,
            'module': record.module,
            'line': record.lineno,
        }
        if record.exc_info:
            payload['exc'] = self.formatException(record.exc_info)

        # Structured extras supplied via `logger.info("...", extra={...})`.
        for key, value in record.__dict__.items():
            if key in _RESERVED or key.startswith('_'):
                continue
            try:
                json.dumps(value)
                payload[key] = value
            except (TypeError, ValueError):
                payload[key] = repr(value)

        return json.dumps(payload, default=str)
