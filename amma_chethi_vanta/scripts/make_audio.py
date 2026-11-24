"""Synthesise the original score (piano / flute / strings) and the sound effects,
then pre-duck the music under every narration cue.

Outputs (48 kHz stereo WAV):
  stems/music_full.wav    - score, NOT ducked (for editors who sidechain themselves)
  stems/music_ducked.wav  - score, ducked under narration cues
  stems/sfx.wav           - sound effects + room tone
  WORK/bed.wav            - ducked music + sfx (used in the film)
"""
import os
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile
from timeline import CUES, TOTAL, STEMS, WORK

SR = 48000
N = int(TOTAL * SR) + SR
rng = np.random.default_rng(7)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def lp(x, fc, order=2):
    return sosfilt(butter(order, fc, "low", fs=SR, output="sos"), x)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def add(buf, sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= buf.shape[1]:
        return
    sig = sig[: buf.shape[1] - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[0, i:i + len(sig)] += sig * gain * l * 1.414
    buf[1, i:i + len(sig)] += sig * gain * r * 1.414


# ---------------------------------------------------------------- instruments
def piano(m, dur, vel):
    f = midi(m)
    ring = min(dur + 1.8, 6.0)
    t = np.arange(int(ring * SR)) / SR
    out = np.zeros_like(t)
    B = 0.00035
    for n in range(1, 9):
        fn = f * n * np.sqrt(1 + B * n * n)
        if fn > 16000:
            break
        amp = (1 / n ** 1.25) * (0.6 + 0.4 * vel) ** (n - 1)
        d = (0.55 + 0.45 * n) * (f / 261.6) ** 0.45
        out += amp * np.sin(2 * np.pi * fn * t + rng.uniform(0, 6.28)) * np.exp(-d * t)
    out *= 1 - np.exp(-t / 0.003)
    rel = np.clip((t - dur) / 0.6, 0, 1)
    out *= (1 - rel) ** 2
    return out * vel * 0.22


def flute(m, dur, vel):
    f = midi(m)
    t = np.arange(int((dur + 0.35) * SR)) / SR
    vib = 1 + 0.0045 * np.sin(2 * np.pi * 5.0 * t) * np.clip((t - 0.35) / 0.5, 0, 1)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR
    tone = np.sin(ph) + 0.22 * np.sin(2 * ph) + 0.09 * np.sin(3 * ph) + 0.03 * np.sin(4 * ph)
    breath = bp(rng.standard_normal(len(t)), f * 0.9, min(f * 2.5, 5000)) * 0.035
    env = np.clip(t / 0.14, 0, 1) * np.clip((dur + 0.3 - t) / 0.3, 0, 1)
    env *= 0.9 + 0.1 * np.sin(np.pi * np.clip(t / max(dur, 0.1), 0, 1))
    return lp((tone + breath) * env * vel * 0.11, 5000)


def strings(ms, dur, vel):
    t = np.arange(int((dur + 2.0) * SR)) / SR
    out = np.zeros_like(t)
    for m in ms:
        for cents in (-9, -4, 0, 5, 10):
            f = midi(m) * 2 ** (cents / 1200)
            ph = (f * t + rng.uniform()) % 1.0
            out += 2 * ph - 1
    out = lp(out, 1800, 4) / (len(ms) * 5)
    env = np.clip(t / 1.6, 0, 1) * np.clip((dur + 1.9 - t) / 1.9, 0, 1)
    return out * env * vel * 0.35


def reverb(x, rt=2.4, wet=0.28):
    n = int(rt * SR)
    t = np.arange(n) / SR
    out = np.zeros_like(x)
    for ch in range(2):
        ir = rng.standard_normal(n) * np.exp(-6.9 * t / rt)
        ir = lp(ir, 5000)
        ir[: int(0.012 * SR)] = 0
        ir /= np.sqrt(np.sum(ir ** 2))
        out[ch] = fftconvolve(x[ch], ir)[: x.shape[1]]
    return x * (1 - wet) + out * wet


# ---------------------------------------------------------------- score
BEAT = 60 / 64.0          # 64 bpm
BAR = 4 * BEAT            # 3.75 s
CH = {  # chord voicings: bass + mid-register tones
    "C": (36, [60, 64, 67, 72]), "G/B": (35, [59, 62, 67, 71]), "Am": (33, [57, 60, 64, 69]),
    "F": (29, [57, 60, 65, 69]), "Fmaj7": (29, [57, 60, 64, 65]), "G": (31, [59, 62, 67, 71]),
    "Dm7": (38, [57, 60, 62, 65]), "Gsus": (31, [60, 62, 67, 72]), "C/E": (40, [60, 64, 67, 72]),
}
PROG = ["C", "G/B", "Am", "F", "C", "G", "Am", "Fmaj7",          # bars 0-7  (0-30 s) present
        "F", "C", "G", "Am", "F", "C", "Dm7", "Gsus", "F",        # bars 8-16 (30-63.75) memory
        "Am", "F", "C", "G",                                      # bars 17-20 build (strings)
        "Am", "F", "G", "C", "C"]                                 # bars 21-25 climax -> end

music = np.zeros((2, N))
for b, name in enumerate(PROG):
    t0 = b * BAR
    bass, tones = CH[name]
    if b <= 5:                       # soft calm piano
        v = 0.35
        hits = [(0, bass + 12, 3.5), (0.0, tones[1], 1.4), (1.5, tones[2], 1.4), (2.5, tones[3], 1.4)]
    elif b <= 7:                     # subtle emotional piano
        v = 0.42
        hits = [(0, bass + 12, 3.6)] + [(k * 0.5, tones[k % 4], 1.0) for k in range(8)]
    elif b <= 16:                    # nostalgic piano under flute
        v = 0.34
        hits = [(0, bass + 12, 3.6)] + [(k * 0.5, tones[(0, 1, 2, 3, 2, 1, 2, 3)[k]], 0.9) for k in range(8)]
    elif b <= 20:                    # build
        v = 0.36 + 0.05 * (b - 17)
        hits = [(0, bass, 3.6), (0, bass + 12, 3.6)] + [(k * 0.5, tones[(0, 2, 1, 3, 2, 3, 1, 2)[k]], 0.9) for k in range(8)]
    elif b <= 23:                    # emotional climax
        v = 0.5 - 0.04 * (b - 21)
        hits = [(0, bass, 3.6), (0, bass + 12, 3.6), (0, tones[0], 1.8), (0.02, tones[2], 1.8),
                (0.04, tones[3] + 12, 1.8)] + [(k * 0.5, tones[k % 4] + (12 if k == 4 else 0), 0.9) for k in range(1, 8)]
    elif b == 24:                    # end card: soft rolled final chord
        v = 0.3
        hits = [(0, bass + 12, 5), (0.15, tones[0], 5), (0.3, tones[1], 5), (0.45, tones[2], 5), (0.6, tones[3] + 12, 5)]
    else:
        continue
    for beat, m, d in hits:
        pan = np.clip((m - 60) / 30, -0.6, 0.6)
        add(music, piano(m, d, v * (0.9 + 0.2 * rng.random())), t0 + beat * BEAT + rng.uniform(0, 0.012), pan=pan)

# Flute melody: (bar, beat, midi, beats)
MEL = [(8, 0, 76, 2), (8, 2, 74, 1), (8, 3, 72, 1), (9, 0, 79, 3), (9, 3, 76, 1),
       (10, 0, 74, 2), (10, 2, 71, 2), (11, 0, 72, 1.5), (11, 1.5, 76, 0.5), (11, 2, 69, 2),
       (12, 0, 81, 2), (12, 2, 79, 1), (12, 3, 77, 1), (13, 0, 76, 3), (13, 3, 67, 1),
       (14, 0, 77, 2), (14, 2, 76, 1), (14, 3, 74, 1), (15, 0, 74, 4), (16, 0, 72, 2), (16, 2, 69, 2),
       (21, 0, 76, 2), (21, 2, 81, 2), (22, 0, 79, 2), (22, 2, 77, 1), (22, 3, 76, 1),
       (23, 0, 74, 2), (23, 2, 76, 1), (23, 3, 74, 1), (24, 0, 72, 4)]
for bar, beat, m, beats in MEL:
    v = 0.75 if bar < 21 else 0.85
    if bar == 24:
        v = 0.55
    add(music, flute(m, beats * BEAT * 0.97, v), bar * BAR + beat * BEAT, pan=0.15)

# Strings: enter scene 7 (bar 17), swell to scene 8, settle at the end
for b in range(17, 25):
    bass, tones = CH[PROG[b]]
    v = {17: 0.25, 18: 0.45, 19: 0.65, 20: 0.85, 21: 1.0, 22: 0.9, 23: 0.7, 24: 0.4}[b]
    add(music, strings([bass + 12, tones[0], tones[2]], BAR, v), b * BAR - 0.4, pan=-0.1)
    add(music, strings([tones[1] + 12], BAR, v * 0.5), b * BAR - 0.4, pan=0.25)

music = reverb(music, 2.6, 0.32)
music = hp(music, 40)
# fades: in over first 1.5 s, out over the last 2.2 s
tt = np.arange(N) / SR
music *= np.clip(tt / 1.5, 0, 1) * np.clip((TOTAL - 0.2 - tt) / 2.2, 0, 1)

# ---------------------------------------------------------------- SFX
sfx = np.zeros((2, N))


def env_ad(n, a, d):
    t = np.arange(n) / SR
    return np.clip(t / a, 0, 1) * np.exp(-t / d)


def thud(dur=0.35, f=70, g=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * f * t * (1 - 0.3 * t)) * np.exp(-t / 0.07)
    nz = lp(rng.standard_normal(n), 900) * np.exp(-t / 0.05) * 0.6
    return (body + nz) * g


def clink(f0, g=1.0, dec=0.25, metal="steel"):
    ratios = [1, 2.76, 5.40, 8.93] if metal == "steel" else [1, 2.0, 3.01, 4.2]
    n = int(dec * 4 * SR)
    t = np.arange(n) / SR
    s = sum((0.6 ** k) * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t / (dec / (1 + k))) for k, r in enumerate(ratios))
    s += hp(rng.standard_normal(n), 3000) * np.exp(-t / 0.004) * 0.5
    return s * g * 0.5


def chop(g=1.0):
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    knock = np.sin(2 * np.pi * 180 * t) * np.exp(-t / 0.018)
    snap = bp(rng.standard_normal(n), 1500, 6000) * np.exp(-t / 0.006) * 0.8
    return (knock + snap) * g


def noise_bed(dur, lo, hi, g, fade=0.4):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = bp(rng.standard_normal(n), lo, hi, 3)
    x /= np.max(np.abs(x)) + 1e-9
    return x * g * np.clip(t / fade, 0, 1) * np.clip((dur - t) / fade, 0, 1)


def creak(dur=0.9, g=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    rate = 35 + 25 * np.sin(np.pi * t / dur)            # stick-slip pulses
    ph = np.cumsum(rate) / SR
    pulses = (np.sin(2 * np.pi * ph) > 0.97).astype(float)
    x = bp(fftconvolve(pulses, np.exp(-np.arange(400) / 60.0) * np.sin(np.arange(400) * 0.09))[:n], 300, 2500)
    x /= np.max(np.abs(x)) + 1e-9
    return x * g * np.sin(np.pi * t / dur)


def bubbles(dur, rate, g):
    out = np.zeros(int(dur * SR))
    for _ in range(int(dur * rate)):
        f = rng.uniform(250, 700)
        n = int(0.04 * SR)
        t = np.arange(n) / SR
        b = np.sin(2 * np.pi * f * (1 + 6 * t) * t) * np.exp(-t / 0.01)
        i = rng.integers(0, len(out) - n)
        out[i:i + n] += b * rng.uniform(0.3, 1)
    return out * g


def scrape(dur, g):
    n = int(dur * SR)
    t = np.arange(n) / SR
    mod = 0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 1.1 * t))
    return bp(rng.standard_normal(n), 1200, 4000) * mod * g * np.clip(t / 0.1, 0, 1) * np.clip((dur - t) / 0.1, 0, 1)


# room tone for present-day scenes (very low) and warmer household tone for memories
add(sfx, noise_bed(30.5, 60, 400, 0.010), 0.0)
add(sfx, noise_bed(36, 80, 1200, 0.012), 29.5)
add(sfx, noise_bed(13.5, 60, 400, 0.010), 64.0)

# Scene 1 - door opening and backpack placement
add(sfx, clink(2200, 0.25, 0.05, "brass"), 0.45)      # latch
add(sfx, creak(1.0, 0.10), 0.55, pan=-0.3)
add(sfx, thud(0.3, 90, 0.18), 2.1, pan=-0.4)          # door settles
add(sfx, thud(0.4, 65, 0.55), 4.65, pan=0.2)          # backpack set down
add(sfx, noise_bed(0.35, 300, 2500, 0.05, 0.08), 4.55, pan=0.2)  # nylon rustle
add(sfx, thud(0.6, 50, 0.30), 6.0)                    # slumps into sofa

# Scene 2 - water running and vegetable chopping
add(sfx, noise_bed(1.9, 600, 7000, 0.10, 0.15), 10.85, pan=-0.2)
for k in range(13):
    add(sfx, chop(0.30 * rng.uniform(0.8, 1.1)), 15.9 + k * 0.31 + rng.uniform(-0.03, 0.03), pan=0.1)

# Scene 3 - stove, boiling dal, spoon stirring
add(sfx, noise_bed(10.3, 2000, 9000, 0.012, 1.0), 19.6)            # gas hiss
add(sfx, bubbles(10.0, 14, 0.06), 19.8, pan=-0.1)                   # dal bubbling
add(sfx, scrape(2.0, 0.035), 20.0)
add(sfx, scrape(1.4, 0.035), 26.9)
add(sfx, clink(1400, 0.22, 0.12, "steel"), 22.6, pan=0.2)          # lid lifted

# Scene 4 - subtle dining ambience
add(sfx, clink(2400, 0.20, 0.10, "steel"), 30.25, pan=-0.2)        # ladle on steel plate
add(sfx, clink(2900, 0.10, 0.08, "steel"), 31.2, pan=0.3)

# Scene 5 - cooking utensils / kitchen ambience
add(sfx, bubbles(11.0, 5, 0.025), 42.0, pan=0.3)
for k, tt0 in enumerate([45.0, 45.6, 46.3]):
    add(sfx, clink(1600 + 300 * k, 0.16, 0.10, "steel"), tt0, pan=-0.2)   # dabba lids
for tt0 in [47.6, 49.4]:
    add(sfx, clink(900, 0.10, 0.06, "brass"), tt0, pan=0.25)               # jars on shelf

# Scene 6 - gentle food-serving sounds
add(sfx, noise_bed(1.6, 200, 2500, 0.035, 0.3), 53.9)                       # rice being mixed
add(sfx, clink(2600, 0.08, 0.08, "steel"), 58.6, pan=0.2)

# Scene 7 - plate and spoon sounds
add(sfx, clink(3100, 0.16, 0.10, "steel"), 65.25, pan=-0.1)
add(sfx, clink(2800, 0.12, 0.09, "steel"), 65.95, pan=-0.1)
add(sfx, clink(3300, 0.07, 0.08, "steel"), 75.0, pan=-0.1)                # spoon set down
# Scene 8 - no SFX, music only

sfx = reverb(sfx, 0.6, 0.15)

# ---------------------------------------------------------------- ducking
def duck_env(depth_db, ramp=0.35, pre=0.25, post=0.35):
    g = np.ones(N)
    low = 10 ** (depth_db / 20)
    for s, e, *_ in CUES:
        a, b = s - pre, e + post
        down = np.where(tt < a - ramp, 1.0,
               np.where(tt < a, 1 - (tt - (a - ramp)) / ramp * (1 - low),
               np.where(tt <= b, low,
               np.where(tt < b + ramp, low + (tt - b) / ramp * (1 - low), 1.0))))
        g = np.minimum(g, down)
    return g


def norm(x, peak_db):
    return x / (np.max(np.abs(x)) + 1e-9) * 10 ** (peak_db / 20)


music = norm(music, -3.0)
music_d = music * duck_env(-10)
sfx = norm(sfx, -9.0) * duck_env(-4)
bed = music_d * 0.85 + sfx

os.makedirs(STEMS, exist_ok=True)
w = lambda p, x: wavfile.write(p, SR, (np.clip(x, -1, 1).T * 32767).astype(np.int16))
w(os.path.join(STEMS, "music_full.wav"), music[:, : int(TOTAL * SR)])
w(os.path.join(STEMS, "music_ducked.wav"), music_d[:, : int(TOTAL * SR)])
w(os.path.join(STEMS, "sfx.wav"), sfx[:, : int(TOTAL * SR)])
w(os.path.join(WORK, "bed.wav"), norm(bed, -1.5)[:, : int(TOTAL * SR)])
print("audio done", TOTAL)
