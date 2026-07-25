# Customer gallery images

Generate these 6 with the prompts below (ChatGPT/DALL-E, Midjourney, or
Codex-driven image tools all work — the prompts are model-agnostic).
Save each file with the exact name listed so `CustomerGallery.vue` picks
them up automatically, no code changes needed.

Common spec for all 6:
- Square aspect ratio, **2000x2000px**
- **Transparent PNG background** (subject cut out, no background at all —
  not white, not gray: alpha channel transparency)
- Soft, natural daylight lighting on the subject/product only
- Candid "customer photo" feel, not studio-polished — slight imperfection
  is good, this is a UGC-style gallery, not a product catalog
- Central Asian / Uzbek people where a person is shown
- No visible logos other than the described print design

---

### 1. `tshirt-mountain.jpg` → generate as PNG, then export/flatten to JPG
**Prompt:**
> Front-facing photo of a young Uzbek man wearing a white oversized
> t-shirt with a printed design on the chest: a minimalist mountain range
> at sunset in an orange square frame with the text "ADVENTURE AWAITS"
> below it. Shot from the chest up, natural window light, candid
> lifestyle photography style, shallow depth of field. Subject only,
> transparent background, no background elements. 2000x2000px, PNG.

### 2. `mug-love.jpg`
**Prompt:**
> Close-up photo of two hands holding a white ceramic mug with a red
> heart shape and the word "Love" printed on it in a clean sans-serif
> font. Soft natural light, warm skin tones, shallow depth of field,
> candid lifestyle product photography. Subject only, transparent
> background. 2000x2000px, PNG.

### 3. `tote-leaf.jpg`
**Prompt:**
> Photo of a young Uzbek man holding a natural canvas tote bag at chest
> height, facing the camera slightly angled. The bag has a simple green
> line-art leaf/plant illustration printed on the front. Candid outdoor
> lifestyle photography, soft daylight. Subject only, transparent
> background. 2000x2000px, PNG.

### 4. `hoodie-leaf.jpg`
**Prompt:**
> Front-facing photo of a young Uzbek woman wearing a light beige
> oversized hoodie with a small green plant/leaf line-art print on the
> chest. Shot from the waist up, soft natural light, candid lifestyle
> photography style. Subject only, transparent background. 2000x2000px,
> PNG.

### 5. `notebook-believe.jpg`
**Prompt:**
> Top-down or 3/4-angle photo of a kraft-paper-cover notebook/journal
> lying on a wooden desk, with hand-lettered text "Believe in yourself"
> printed on the cover in a clean script font. Soft natural light, warm
> tones, cozy desk-still-life feel. Notebook only, transparent
> background (desk surface removed). 2000x2000px, PNG.

### 6. `mug-workhard.jpg`
**Prompt:**
> Photo of a matte black ceramic mug with the text "WORK HARD DREAM BIG"
> printed in bold white sans-serif letters, sitting at a slight angle so
> both the front text and the handle are visible. Soft studio-style
> lighting with gentle shadow. Subject only, transparent background.
> 2000x2000px, PNG.

---

If you'd rather batch these through Codex/another tool: pass each prompt
verbatim, request PNG output with alpha transparency explicitly (some
models default to a white background even when "transparent" is asked
for — re-prompt with "remove background, keep alpha channel" if that
happens), then drop the files in this folder using the exact filenames
above (`.jpg` extension is fine even though the source is PNG — Nuxt
Image will re-encode to webp at request time either way).
