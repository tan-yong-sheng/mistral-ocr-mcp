# 📝 Mistral OCR with `curl`

This quick reference shows how to call Mistral OCR using `curl` for:

1. **Local PDF file** (upload → signed URL → OCR)
2. **Publicly hosted PDF URL** (direct OCR call)

---

## 🔐 Prerequisites

- Export your API token as an environment variable:

  ```bash
  export MISTRAL_API_KEY="c2pX..."
  ```

- Ensure your file complies with the OCR API limits: **≤ 50 MB**, **≤ 1,000 pages**

---

## 📄 1. OCR from a Local PDF (upload → URL → OCR)

### ✅ Step 1: Upload the file for OCR

```bash
curl https://api.mistral.ai/v1/files \
  -H "Authorization: Bearer $MISTRAL_API_KEY" \
  -F purpose="ocr" \
  -F file="@path/to/local.pdf"
```

**Response:**

```json
{
  "id": "abcdef12-3456-7890-abcd-ef1234567890"
}
```

Save the `id`.

---

### 🔗 Step 2: Retrieve a Signed URL

```bash
curl -X GET "https://api.mistral.ai/v1/files/<YOUR_FILE_ID>/url?expiry=24" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $MISTRAL_API_KEY"
```

**Response:**

```json
{
  "url": "https://files.mistral.ai/signed/...token"
}
```

---

### 🔍 Step 3: Send that URL to the OCR Endpoint

```bash
curl https://api.mistral.ai/v1/ocr \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MISTRAL_API_KEY" \
  -d '{
       "model": "mistral-ocr-latest",
       "document": {
         "type": "document_url",
         "document_url": "https://files.mistral.ai/...signed"
       },
       "include_image_base64": true
     }' \
  -o ocr_result.json
```

The result contains structured output and Markdown per page.

---

## 🌐 2. OCR from a Public PDF URL

If your PDF is publicly accessible, you can skip the upload step:

```bash
PDF_URL="https://example.com/document.pdf"

curl https://api.mistral.ai/v1/ocr \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MISTRAL_API_KEY" \
  -d '{
       "model": "mistral-ocr-latest",
       "document": {
         "type": "document_url",
         "document_url": "'"$PDF_URL"'"
       },
       "include_image_base64": false
     }' \
  -o ocr_public.json
```

This sends the URL directly to Mistral's OCR engine.

---

## 🧩 What the OCR Output Looks Like

Returned JSON includes:

- `pages`: Array of page objects:
  - `markdown`: Clean structured text
  - `images`: (if `include_image_base64` is `true`)
  - `dimensions`: DPI, width, height
- `usage_info`: Pages processed, etc.
- `model`: OCR model used

**Example:**

```json
{
  "index": 1,
  "markdown": "# Introduction to OCR\nClean output in markdown…",
  "images": [ /* if requested */ ],
  "dimensions": { "dpi": 300, "height": 1600, "width": 1200 }
}
```

---

## 💡 Tips & Best Practices

- Always include `"Content-Type: application/json"` and a valid `"Authorization"` header.
- `"include_image_base64": true` embeds image data; omit if not needed.
- Alternatively, use `"document_url": "data:application/pdf;base64,...“` for base64 inline docs.
- The default model `"mistral-ocr-latest"` supports:
  - Complex layouts (tables, columns)
  - Mathematical content
  - 80+ languages
  - Clean Markdown formatting

---

## ✅ Quick Summary

| Case                | Steps                        | API Calls              |
|---------------------|-------------------------------|------------------------|
| Local PDF (`my.pdf`) | Upload → Signed URL → OCR     | `/v1/files`, `/v1/ocr` |
| Public PDF URL      | Direct OCR with URL           | `/v1/ocr`              |

---

## 🧪 Sample Shell Script

```bash
#!/usr/bin/env bash

# Step 1: Upload
FID=$(curl https://api.mistral.ai/v1/files \
        -H "Authorization: Bearer $MISTRAL_API_KEY" \
        -F purpose="ocr" \
        -F file="@my.pdf" \
        | jq -r .id)

# Step 2: Get signed URL
SIGNED_URL=$(curl -s "https://api.mistral.ai/v1/files/$FID/url?expiry=24" \
        -H "Authorization: Bearer $MISTRAL_API_KEY" \
        | jq -r .url)

# Step 3: OCR
curl https://api.mistral.ai/v1/ocr \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MISTRAL_API_KEY" \
  -d "{\"model\":\"mistral-ocr-latest\",\"document\":{\"type\":\"document_url\",\"document_url\":\"$SIGNED_URL\"},\"include_image_base64\":true}" \
  -o ocr_local.json
```

---

✅ That’s it!  
Use this markdown in `README.md`, automation scripts, or internal docs to quickly integrate Mistral OCR with `curl`.
