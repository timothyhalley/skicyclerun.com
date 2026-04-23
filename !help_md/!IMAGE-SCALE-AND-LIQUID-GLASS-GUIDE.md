# Image Scale And Liquid Glass Guide

This document is the bootstrap reference for future photo layout and image presentation work.

It combines:

- the image sizing pipeline described from the external image-generation repo
- the display and presentation rules implemented in this repo for Hero, Gallery, Carousel, and related photo surfaces

Use this file as the starting point before changing photo layout behavior, aspect ratios, control sizing, or visual treatment.

## Scope

This guide covers two separate concerns:

1. How images are created upstream
2. How those images should be displayed in this repo

Important:

- The image creation pipeline is not implemented in this repo.
- The sizing notes below were provided from the external image-generation repo during development of this layout system.
- Treat the pipeline section as upstream contract and bootstrap context for display decisions here.

## Upstream Image Scale Contract

### Quick answer

- Standard LoRA feed size uses `lora_processing.max_dim`, currently `1024`.
- Aspect ratio is preserved.
- Width and height are rounded to multiples of `16` before inference.
- Final generated image size matches the prepared inference size.

### Stage 4: Preprocessing

Purpose:

- Normalize and optimize source images before LoRA processing.

Rules:

- `preprocessing.max_dimension` is currently `2048`.
- If an image is already within `2048 x 2048`, original dimensions are kept.
- If larger, it is scaled down to fit within `2048` while preserving aspect ratio.
- Dimensions are rounded down to multiples of `8`.

Typical result:

- A preprocessed image with max side up to `2048`, ready for downstream processing.

### Stage 6: LoRA preparation before inference

Purpose:

- Prepare preprocessed images for FLUX LoRA inference.

Rules:

- Input is read from the preprocessed folder.
- `lora_processing.max_dim` is currently `1024`.
- Longest side is resized to `1024`.
- Short side is computed from aspect ratio.
- Both dimensions are rounded to multiples of `16`.

Typical result:

- Inference input size has long side `1024` and both sides divisible by `16`.

### Standard sizes fed to LoRA

There is not one fixed size. Standard output is an aspect-ratio-preserving family with long side `1024` and multiple-of-16 rounding.

Common examples:

- `1024 x 1024`
- `1024 x 768`
- `1024 x 640`
- `1024 x 576`
- `1024 x 512`

Exact short side depends on source image aspect ratio.

### Final output size

Inference is called with explicit `width` and `height` taken from the prepared image.

Therefore:

- Final LoRA output dimensions equal prepared inference dimensions.
- No additional resize is applied when saving the generated image.

### Exception modes

#### low_memory mode

Overrides:

- `max_dim = 512`
- `num_inference_steps = 12`
- `precision = float16`

#### tiny_mode

Overrides:

- `max_dim = 256`
- `num_inference_steps = 8`
- `precision = float16`

In both modes, the same aspect-ratio-preserving and multiple-of-16 behavior still applies.

### Important note about the 512-cap helper

There is a separate helper that caps to `512`, but the active LoRA path uses `load_and_prepare_image`, which is the `1024`-based path by default.

## Display Guidance In This Repo

### Core display rule

Treat `1024` longest-side output as the standard native-detail baseline for generated assets.

Practical implications:

- Avoid stretching images noticeably beyond their generated native size.
- Preserve aspect ratio whenever possible.
- Prefer presentation systems that adapt to aspect ratio rather than forcing all images into one crop.
- Use cropping only when it is an explicit visual decision.

### Layout intent

The photo system in this repo was updated toward a 2026 iOS-style presentation language:

- more edge-to-edge framing
- translucent liquid-glass controls
- soft depth, blur, and layered gradients
- better behavior for iPhone, iPad, and iPad split-view widths

This is presentation-only work. It does not change upstream image generation.

## Current Photo Surfaces

Primary files:

- `src/layouts/PhotoLayout.astro`
- `src/layouts/MDXHeroView.astro`
- `src/layouts/MDXGalleryView.astro`
- `src/layouts/MDXCarousel3.astro`

Related surfaces that now follow the same visual language:

- `src/components/RemotePhotoGallery.tsx`
- `src/components/ImageCard.astro`

## Hero / Gallery / Carousel Guidance

### Hero

Use when:

- one image should dominate the experience
- the page benefits from a more cinematic or editorial presentation

Display rules:

- Prefer `object-fit: contain` when preserving the full image matters.
- Allow the frame to adapt by device width instead of forcing one universal square.
- Keep glass overlays lightweight and out of the image center.

### Gallery

Use when:

- multiple images should be scanned quickly
- image browsing matters more than single-image focus

Display rules:

- Preserve visual rhythm through responsive tile layout.
- Let the container adapt to device aspect ratio rather than assuming fixed square-only composition.
- Use `cover` only where small, intentional tile crops are acceptable.

### Carousel

Use when:

- swipe navigation is the primary interaction
- a single frame should cycle through many images

Display rules:

- Prefer `contain` for the main image so native composition is preserved.
- Keep controls compact and floating, especially on smaller split-view widths.
- Do not let control chrome overpower the image on iPad split modes.

## Device Aspect Rules

These rules are the current display baseline in this repo.

### iPhone portrait

- Target frame aspect: `4 / 5`
- Intent: slightly taller, camera-roll-friendly presentation

### iPhone landscape

- Target frame aspect: `16 / 10`
- Intent: wider cinematic presentation with less dead space

### iPad portrait

- Target frame aspect: `3 / 4`

### iPad landscape

- Target frame aspect: `4 / 3`

### iPad split view, narrower bands

Additional tuning exists for split widths, not just orientation:

- Narrow split widths use tighter spacing and smaller control density.
- Medium split widths keep the same visual language with slightly taller framing than full-width landscape.

Design intent:

- 50/50 split should not feel oversized or padded.
- 33/67 and similar widths should still feel deliberate, not like a squeezed full-screen layout.

## Liquid Glass Design Rules

### Visual language

Use:

- translucent backgrounds
- subtle backdrop blur
- soft borders with light inner highlights
- layered shadows instead of heavy hard-edged elevation

Avoid:

- thick opaque toolbars
- high-contrast boxed controls that feel desktop-first
- forcing every photo surface into rigid square framing

### Motion

Current interaction style favors:

- small entrance transitions
- staggered tile reveals
- subtle press and hover compression
- reduced-motion fallback support

Do not add motion that distracts from the image itself.

## Bootstrap Rules For Future Changes

Before changing photo layout behavior:

1. Check whether the change affects upstream image assumptions or only local presentation.
2. Preserve aspect ratio by default.
3. Avoid introducing new hard-coded pixel dimensions unless tied to a device-width rule.
4. Test whether the change still feels balanced at:
   - iPhone portrait
   - iPhone landscape
   - iPad portrait
   - iPad landscape
   - iPad split view
5. Keep controls visually secondary to the image.

### If you need to maximize image presence

Use this order of preference:

1. Adjust frame aspect per device width
2. Reduce surrounding chrome and spacing
3. Use `contain` before crop-heavy `cover`
4. Only crop aggressively when the design explicitly calls for it

### If images look soft or too small

Check:

1. Whether the rendered size exceeds likely native output dimensions
2. Whether the current frame aspect is wasting viewport height or width
3. Whether control padding or overlays are stealing too much usable image area

## Source Of Truth

For future work, use this priority order:

1. Upstream image generation contract in this file for sizing context
2. Current layout implementation in the photo layout files
3. Device-specific presentation tuning already implemented in this repo

If there is ever a conflict between this file and upstream generation code, upstream generation code wins for image creation behavior.

If there is a conflict between this file and current repo code, repo code wins until this document is updated.

## Maintenance Note

When future photo layout changes are made, update this file if any of these change:

- upstream max dimension assumptions
- aspect-ratio strategy by device
- Hero/Gallery/Carousel display rules
- liquid-glass control behavior
- split-view sizing rules
