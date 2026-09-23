# Food Finder

An Expo (React Native) app that tells you what to cook or where to eat, based
on your mood, what's in your pantry, your recent activity, and nearby
restaurant reviews.

## What it does

- **Mood-based recommendations** — pick a mood (stressed, comfort, adventurous,
  healthy, lazy, celebratory, sad, romantic), choose Cook / Eat out / Surprise
  me, and optionally ask for a quick (≤20 min) recipe only. Claude
  (`claude-opus-5`) returns a single structured recommendation: either a full
  recipe or a ranked list of nearby restaurants.
- **Pantry-aware** — recipes are built from what's actually in your pantry
  (Pantry tab), and only list what you'd need to buy on top of that.
- **Activity-aware** — log a workout (Activity tab); a recent moderate/high
  intensity session biases recommendations toward higher-protein meals for
  the next ~36 hours.
- **Receipt scanning (mock)** — "Scan a receipt" in the Pantry tab picks a
  photo and runs it through a mock OCR adapter that returns sample grocery
  line items, which get merged into your pantry. This proves out the full
  flow without needing an OCR API key yet.
- **Restaurant reviews (mock)** — nearby places (name, cuisine, rating,
  distance, review highlights) come from a mock reviews adapter tuned per
  mood, so restaurant recommendations work without a Google Places key.

## Architecture

```
lib/
  types.ts            Pantry/Activity/Mood/Recommendation types
  storage.ts          AsyncStorage-backed pantry & activity persistence
  adapters/
    reviews.ts         ReviewsProvider interface + MockReviewsProvider
    ocr.ts              OCRProvider interface + MockOCRProvider
  llm/
    client.ts           Anthropic client, API key stored via expo-secure-store
    recommend.ts         Prompt building + structured tool-call recommendation
app/(tabs)/
  index.tsx            Home — mood picker, cook/eat-out toggle, results
  pantry.tsx           Pantry CRUD + receipt scan
  activity.tsx         Activity log
  settings.tsx         API key, location, data-source status
```

The **LLM recommendation engine is real** — it calls the Claude API directly.
The **peripheral data sources are mocked** behind small provider interfaces
(`ReviewsProvider`, `OCRProvider`) so the app is fully demoable with no
external API keys, and each has a `TODO(real integration)` comment marking
where to plug in a real implementation:

- `ReviewsProvider` → Google Places API (Nearby Search + Place Details)
- `OCRProvider` → Google Cloud Vision OCR, or a Claude vision call against the
  receipt photo
- Activity is manual entry today; a `ActivityProvider`-style adapter would be
  the seam for HealthKit / Google Fit / Fitbit later.

## Setup

```bash
npm install
npx expo start
```

Then open in a development build, Android emulator, iOS simulator, or Expo
Go. On first launch, go to **Settings** and paste an Anthropic API key
(`sk-ant-...`) — it's stored on-device with `expo-secure-store`. Without a
key, Home will prompt you to add one.

> **Security note:** this MVP calls the Claude API directly from the app with
> a key held on-device. That's fine for personal use, but before shipping
> this to other people's phones, move the call in `lib/llm/recommend.ts`
> behind a small backend proxy that holds the real API key server-side — a
> key embedded in a distributed app binary can be extracted.

## Next steps

- Swap `MockReviewsProvider` for a real Google Places-backed provider.
- Swap `MockOCRProvider` for real OCR (Vision API or a Claude vision call).
- Add a HealthKit/Google Fit-backed `ActivityProvider` for automatic activity
  sync instead of manual logging.
- Move the Claude API call behind a backend proxy before distributing builds.
