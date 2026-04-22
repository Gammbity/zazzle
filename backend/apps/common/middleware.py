"""
Cross-cutting middleware.

RequestIDMiddleware assigns a stable UUID to every request, echoes it back in
the `X-Request-ID` response header, and exposes it to logging via a
contextvar so JSON log lines can be correlated across backend + frontend +
third-party integrations.
"""
import uuid

from .logging import request_id_ctx

REQUEST_ID_HEADER = 'HTTP_X_REQUEST_ID'
RESPONSE_HEADER = 'X-Request-ID'


class RequestIDMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Honour upstream-provided IDs (nginx, load balancer, FE client)
        # so a single request can be traced end-to-end.
        incoming = request.META.get(REQUEST_ID_HEADER, '').strip()
        request_id = incoming or uuid.uuid4().hex
        request.request_id = request_id
        token = request_id_ctx.set(request_id)
        try:
            response = self.get_response(request)
        finally:
            request_id_ctx.reset(token)
        response[RESPONSE_HEADER] = request_id
        return response
