# Plan: Invoice Upload

**Branch:** `feature/invoice-upload`
**Based on:** `develop`
**Spec reference:** `~/study/budgetly/NEXTJS_MIGRATION_CONTEXT.md` — Invoice Upload section

---

## Goal

Allow users to upload a credit card invoice (PDF, PNG, or JPEG) via drag-and-drop or file picker. The file is validated, saved to disk, and an invoice record is inserted into the database with `status = pending`.

---

## Scope

### API Routes

| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/invoices` | Validate file, save to disk, insert invoice row |
| GET | `/api/invoices` | List all invoices ordered by `created_at DESC` |

**POST rules:**
- Requires `X-OpenAI-API-Key` header (validated presence only — used later by OCR)
- Accepted types: `application/pdf`, `image/png`, `image/jpeg`
- Max size: 10 MB
- Filename: `{invoiceId}_{sanitizedFilename}.{ext}`
- On DB insert failure: delete the saved file

### Frontend Pages & Components

| Path | Purpose |
|------|---------|
| `app/upload/page.tsx` | Upload page — hosts the file upload component |
| `components/file-upload.tsx` | Drag-and-drop area, progress bar, image preview |

### `file-upload.tsx` behaviour
- Drag-and-drop + click-to-browse
- Client-side validation (type + size) before sending
- Upload progress bar
- Image preview for PNG/JPEG (not PDF)
- On success: redirect to `/invoices/[id]/review`

---

## Files to Create

```
app/
  upload/
    page.tsx
  api/
    invoices/
      route.ts
components/
  file-upload.tsx
```

## Files Already in Place (no changes needed)

- `lib/file.ts` — `validateFile`, `saveFile`, `deleteFile`
- `lib/response.ts` — response envelope helpers
- `lib/db.ts` — Prisma singleton
- `prisma/schema.prisma` — `Invoice` model ready

---

## Implementation Steps

1. **`POST /api/invoices`**
   - Parse `multipart/form-data` using `request.formData()`
   - Check `X-OpenAI-API-Key` header is present (400 if missing)
   - Call `validateFile()` — return 400 on failure
   - Generate `invoiceId` (`crypto.randomUUID()`)
   - Call `saveFile(file, invoiceId)` to write to disk
   - Insert invoice row via Prisma; on error call `deleteFile()` then return 500
   - Return 201 with the created invoice

2. **`GET /api/invoices`**
   - Query all invoices ordered by `createdAt DESC`
   - Return 200 with array

3. **`app/upload/page.tsx`**
   - Simple page shell that renders `<FileUpload />`

4. **`components/file-upload.tsx`**
   - Controlled drag-and-drop with `onDragOver` / `onDrop`
   - Client-side `validateFile`-equivalent check before upload
   - `fetch` to `POST /api/invoices` with `FormData`
   - Track upload progress via `XMLHttpRequest` (supports `onprogress`)
   - Show image preview using `URL.createObjectURL`
   - On 201 response: `router.push('/invoices/[id]/review')`

---

## Acceptance Criteria

- [ ] PDF, PNG, and JPEG files upload successfully
- [ ] Files over 10 MB are rejected client-side and server-side
- [ ] Unsupported file types are rejected with a clear error message
- [ ] Missing `X-OpenAI-API-Key` header returns 400
- [ ] Uploaded file appears on disk under `UPLOAD_DIR`
- [ ] Invoice row is created in DB with `status = pending`
- [ ] `GET /api/invoices` returns the uploaded invoice
- [ ] Image files show a preview after selection
- [ ] Upload progress bar is visible during upload
- [ ] On success, user is redirected to the review page
