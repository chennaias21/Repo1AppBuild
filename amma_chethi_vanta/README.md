# అమ్మ చేతి వంట: edit package (v1)

## What is finished

| Item | Status |
|---|---|
| 8 clips in story order, trimmed, timed to 10/10/10/12/12/11/12/13 s | Done |
| 16:9 1920×1080, 30 fps MP4 (vertical clips placed on a blurred backdrop) | Done |
| Original AI audio removed | Done |
| Warm grade; warmer, faded look for memories (Scenes 4–6, 8) | Done |
| Slow-motion (motion-interpolated) on Scenes 4–8 to reach 90 s | Done |
| Slow zoom on Scenes 6, 7, 8; cross-dissolves (longer into/out of memories) | Done |
| Opening title, end card with the ❤️ message (~3.8 s on screen) | Done |
| Original score: piano → piano + flute (memories) → strings build → soft ending | Done |
| Sound effects for Scenes 1–7 (Scene 8 is music only) | Done |
| Telugu subtitles, white text with a dark outline, bottom centre (burned in, plus .srt/.ass) | Done |
| Music already lowered (−10 dB) under every narration slot | Done |
| **Telugu narration and the child/mother voices** | **Still to do: record and drop in (below)** |

Why the voice is missing: this build environment has no natural-sounding Telugu voice
engine, and the online voice services are blocked. The only offline option is robotic, so it
was left out rather than spoil the film.

## Files

- `output/Amma_Chethi_Vanta_v1_music_sfx_subs_1080p.mp4`: the film (95 s) with music, effects and subtitles
- `output/amma_chethi_vanta_te.srt`: subtitles only (for YouTube or another editor)
- `output/amma_chethi_vanta_te.ass`: styled subtitles, title and end card text
- `stems/music_full.flac`: score with no ducking (for editors who duck it themselves)
- `stems/music_ducked.flac`: score already lowered under narration
- `stems/sfx.flac`: sound effects and room tone
- `scripts/`: rebuild scripts (`timeline.py` holds every timing)

## Voice recording sheet (record each line separately; start time = where it goes in the film)

| Scene | Voice | Start | End | Length | Line |
|---|---|---|---|---|---|
| 1 | Narrator | 00:03.80 | 00:06.60 | 2.8 s | రోజంతా ఆఫీసులో పని చేసి ఇంటికి వచ్చేసరికి... |
| 1 | Narrator | 00:06.80 | 00:09.40 | 2.6 s | శరీరం పూర్తిగా అలసిపోయింది. |
| 2 | Narrator | 00:11.00 | 00:14.80 | 3.8 s | ఇక రాత్రికి భోజనం కూడా మనమే తయారు చేసుకోవాలి. |
| 3 | Narrator | 00:24.40 | 00:28.20 | 3.8 s | ఒక్క పూట వంట చేయడానికే ఇంత సమయం పడుతుందా! |
| 4 | Child | 00:32.30 | 00:35.00 | 2.7 s | అమ్మా! మళ్ళీ అవే వంటలా? రోజూ ఇదేనా? |
| 4 | Child | 00:35.10 | 00:37.40 | 2.3 s | ఏదైనా స్పెషల్ చేయొచ్చుగా! |
| 4 | Mother | 00:37.90 | 00:40.80 | 2.9 s | తిను నాన్నా... ప్రేమగా చేశాను. |
| 5 | Narrator | 00:42.80 | 00:46.40 | 3.6 s | అప్పుడు అమ్మ వంట చేయడం మాత్రమే చూశాను... |
| 5 | Narrator | 00:46.60 | 00:50.20 | 3.6 s | కానీ ఆ వంటతో పాటు ఇంటి పనులన్నీ ఎలా చూసుకునేదో |
| 5 | Narrator | 00:50.30 | 00:52.90 | 2.6 s | ఒక్కసారి కూడా ఆలోచించలేదు. |
| 6 | Narrator | 00:54.80 | 00:58.20 | 3.4 s | అమ్మ చేతి వంటలో ఏదో తెలియని రుచి ఉండేది. |
| 6 | Narrator | 00:58.50 | 01:03.60 | 5.1 s | ఆ రుచి వెనుక ఎంత ప్రేమ, శ్రమ ఉండేదో ఇప్పుడు తెలుస్తోంది. |
| 7 | Narrator | 01:06.00 | 01:09.40 | 3.4 s | ఈరోజు నా చేత్తో వండుకుని తింటుంటే... |
| 7 | Narrator | 01:09.70 | 01:14.60 | 4.9 s | అమ్మ పెట్టిన ఆ మామూలు భోజనమే ఎంత ప్రత్యేకమో తెలిసింది. |
| 8 | Narrator | 01:18.00 | 01:19.40 | 1.4 s | అమ్మా... |
| 8 | Narrator | 01:19.60 | 01:22.60 | 3.0 s | నువ్వు వండింది మామూలు భోజనం కాదు. |
| 8 | Narrator | 01:23.00 | 01:26.40 | 3.4 s | నీ సమయాన్ని, నీ శ్రమను, నీ ప్రేమను |
| 8 | Narrator | 01:26.60 | 01:29.20 | 2.6 s | మాకు ప్రతిరోజూ వడ్డించావు. |

Tips for reading the lines: speak slowly and warmly. Hold "..." pauses for about half a second.
Scene 8 is the softest and most intimate, almost a whisper on "అమ్మా...". The child sounds
annoyed but cute; the mother is gentle and smiling (she is smiling on screen at 00:37.9).
A line may run about 0.3 s past its slot. The music returns to full level about 0.35 s
after each slot ends.

## Adding the voice

**Phone/desktop editor (CapCut, VN, Premiere, DaVinci):**
1. Import the MP4. Keep its audio track: it holds the music and effects.
2. Place each recorded line at the start time in the table above.
3. Set narration level so peaks sit around −6 dB. Don't push the music back up: it is already lowered.
4. Export 1080p, 30 fps, MP4.

**Or with one ffmpeg command** (if you record one continuous 95 s track with each line at its start time):

```
ffmpeg -i output/Amma_Chethi_Vanta_v1_music_sfx_subs_1080p.mp4 -i narration.wav \
  -filter_complex "[1:a]highpass=f=80,acompressor=threshold=-20dB:ratio=3,volume=1.0[n];[0:a][n]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-1.5[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k Amma_Chethi_Vanta_FINAL.mp4
```

## Known limitations (from the source clips, not the edit)

- The clips are 360×640. Scaled to 1080 height, they look softer than native HD footage.
- The vertical clips are placed on a blurred backdrop. Cropping them to fill 16:9 would cut faces and blur them further.
- The generator's small ✦ watermark (bottom-right of each clip) is still visible.
- Scenes 4–8 are slowed about 1.5–1.8× to reach the 90 s target. Lip movement in Scene 4 (child) and Scene 7 (son) won't match the voice exactly.
- The score and effects are synthesised. They work, but a licensed library track (YouTube Audio Library, Pixabay Music) would sound richer. Swap it in under `music_full.flac`'s timing if you want.
