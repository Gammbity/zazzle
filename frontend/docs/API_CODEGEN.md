# API Type Codegen

The backend exposes OpenAPI at `/api/schema/` (drf-spectacular, already wired in `backend/zazzle/urls.py:45`). The frontend uses `openapi-typescript` to generate strongly-typed bindings into `src/types/api.d.ts`.

## Generate types

**Option A — from a running backend (preferred for dev loops):**
```powershell
# Terminal 1
cd backend
python manage.py runserver  # serves http://localhost:8000

# Terminal 2
cd frontend
npm run codegen:api
```

**Option B — from a static schema file (preferred for CI):**
```powershell
cd backend
python manage.py spectacular --color --file schema.yml

cd ../frontend
npm run codegen:api:file
```

## When to re-run

- Backend serializer or viewset changes
- New API endpoint added
- Before opening a PR that touches `lib/commerce`

## How `lib/commerce` uses the generated types

`src/types/api.d.ts` exports `paths` and `components.schemas`. Wrap them with a thin helper:

```ts
import type { paths, components } from '@/types/api';

export type CommerceUser = components['schemas']['User'];
export type CommerceCart = components['schemas']['Cart'];
export type CommerceOrderDetail = components['schemas']['OrderDetail'];
// ...
```

That way, when the backend renames a field, `tsc` fails immediately in the frontend instead of at runtime.

## CI integration (future)

Add to `.github/workflows/ci.yml`:
```yaml
- run: cd backend && python manage.py spectacular --file schema.yml
- run: cd frontend && npm run codegen:api:file
- run: cd frontend && git diff --exit-code src/types/api.d.ts
```

This fails the build if the committed types are out of date.
