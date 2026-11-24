"""Picture edit: per-scene render -> cross-dissolve chain -> titles/subtitles -> mux."""
import os
import subprocess
import json
from timeline import (SCENES, STARTS, CUES, TITLE, END_LINES, END_TEXT_IN, END_TEXT_OUT,
                      FILM_BODY, TOTAL, END_CARD, TRIM_HEAD, TRIM_TAIL, FPS, W, H,
                      UPLOADS, OUT, WORK)


def run(cmd):
    print(">>", " ".join(cmd)[:160], "...")
    subprocess.run(cmd, check=True)


def dur(p):
    o = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", p],
                       capture_output=True, text=True, check=True).stdout
    return float(json.loads(o)["format"]["duration"])


GRADE = {
    # subtle warm grade, natural skin
    "present": "colorbalance=rs=0.03:bs=-0.03:rm=0.02:bm=-0.025,eq=contrast=1.04:saturation=1.03",
    "present_low": "colorbalance=rs=0.025:bs=-0.02:rm=0.015:bm=-0.02,eq=contrast=1.05:saturation=0.98:brightness=-0.015",
    # childhood memory: warmer, slightly faded blacks (nostalgic)
    "memory": "colorbalance=rs=0.06:gs=0.015:bs=-0.07:rm=0.05:bm=-0.05:rh=0.03:bh=-0.03,"
              "curves=all='0/0.045 0.5/0.52 1/0.97',eq=saturation=0.96",
    "memory_glow": "colorbalance=rs=0.06:gs=0.02:bs=-0.07:rm=0.05:bm=-0.05:rh=0.04:bh=-0.04,"
                   "curves=all='0/0.05 0.5/0.53 1/0.98',eq=saturation=0.95",
}

# ------------------------------------------------------------ per-scene renders
segs = []
prev_x = 0.0
for no, fname, D, x_out, look, zoom in SCENES:
    src = os.path.join(UPLOADS, fname)
    C = dur(src)
    L = D + prev_x                     # slot + incoming dissolve overlap
    if no == 8:
        L = D + prev_x + 0.0           # end-card dissolve happens over the tail (handled by card)
    L_render = L + (x_out if no == 8 else 0)   # scene 8 runs under the end-card dissolve
    used = C - TRIM_HEAD - TRIM_TAIL
    f = L_render / used
    nf = int(round(L_render * FPS))
    out = os.path.join(WORK, f"seg{no}.mp4")
    glow = ""
    if look == "memory_glow":
        glow = ",split[g1][g2];[g2]gblur=sigma=12[g3];[g1][g3]blend=all_mode=screen:all_opacity=0.18"
    zoomf = ""
    if zoom:
        zoomf = (f",scale=3840:2160:flags=bicubic,zoompan=z='1+0.07*on/{nf}':"
                 f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s={W}x{H}:fps={FPS}")
    fc = (
        f"[0:v]trim=start={TRIM_HEAD}:end={C - TRIM_TAIL},setpts=(PTS-STARTPTS)*{f:.5f},"
        f"minterpolate=fps={FPS}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,"
        f"{GRADE[look]}{glow},split[a][b];"
        f"[a]scale=-2:{H}:flags=lanczos,unsharp=5:5:0.5:5:5:0[fg];"
        f"[b]crop=iw:iw*9/16,scale={W}:{H}:flags=bicubic,gblur=sigma=35,"
        f"eq=brightness=-0.10:saturation=0.85[bg];"
        f"[bg][fg]overlay=(W-w)/2:0,vignette=angle=PI/5{zoomf},"
        f"trim=end_frame={nf},setpts=PTS-STARTPTS,format=yuv420p[v]"
    )
    if not (os.environ.get("REUSE") and os.path.exists(out)):
      run(["ffmpeg", "-v", "error", "-y", "-i", src, "-filter_complex", fc, "-map", "[v]", "-an",
         "-r", str(FPS), "-c:v", "libx264", "-crf", "15", "-preset", "medium", out])
    segs.append((no, out, prev_x))
    prev_x = x_out

# ------------------------------------------------------------ end card background
seg8 = segs[-1][1]
still = os.path.join(WORK, "card_bg.png")
run(["ffmpeg", "-v", "error", "-y", "-sseof", "-0.5", "-i", seg8, "-frames:v", "1", "-update", "1", still])
X8 = SCENES[-1][3]
card_len = END_CARD + X8
card = os.path.join(WORK, "card.mp4")
ncard = int(round(card_len * FPS))
run(["ffmpeg", "-v", "error", "-y", "-loop", "1", "-i", still, "-filter_complex",
     f"[0:v]scale={W*2}:{H*2},zoompan=z='1.04+0.04*on/{ncard}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
     f"d=1:s={W}x{H}:fps={FPS},gblur=sigma=28,"
     f"colorbalance=rs=0.10:gs=0.03:bs=-0.10:rm=0.08:bm=-0.08,eq=brightness=-0.16:saturation=1.05,"
     f"vignette=angle=PI/4,fade=t=out:st={card_len - 0.7}:d=0.7,format=yuv420p[v]",
     "-map", "[v]", "-frames:v", str(ncard), "-r", str(FPS), "-c:v", "libx264", "-crf", "15", card])

# ------------------------------------------------------------ ASS subtitles + titles
def ts(t):
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"


HEART = r"{\p1\1c&H3A3AD8&\bord0\shad0}m 25 12 b 25 0 0 0 0 14 b 0 28 15 36 25 46 b 35 36 50 28 50 14 b 50 0 25 0 25 12{\p0}"
ass = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
ScaledBorderAndShadow: yes
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,Noto Sans Telugu UI,52,&H00FFFFFF,&H00FFFFFF,&H00141414,&H90000000,0,0,0,0,100,100,0,0,1,2.6,1.2,2,120,120,64,1
Style: Title,Ramaraja,160,&H00D9EEFF,&H00FFFFFF,&H00203040,&HA0000000,0,0,0,0,100,100,0,0,1,1.5,4,5,60,60,60,1
Style: End1,Ramaraja,96,&H00D9EEFF,&H00FFFFFF,&H00203040,&HA0000000,0,0,0,0,100,100,0,0,1,1.2,3,5,60,60,60,1
Style: End2,Ramaraja,76,&H00FFFFFF,&H00FFFFFF,&H00203040,&HA0000000,0,0,0,0,100,100,0,0,1,1.2,3,5,60,60,60,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
ass += f"Dialogue: 1,{ts(TITLE[0])},{ts(TITLE[1])},Title,,0,0,0,,{{\\fad(700,600)\\blur1.2}}{TITLE[2]}\n"
for s, e, who, text, _ in CUES:
    ass += f"Dialogue: 0,{ts(s)},{ts(e)},Sub,{who},0,0,0,,{{\\fad(120,150)}}{text}\n"
ass += (f"Dialogue: 1,{ts(END_TEXT_IN)},{ts(END_TEXT_OUT)},End1,,0,0,0,,"
        f"{{\\pos({W//2},{H//2 - 70})\\fad(600,500)\\blur0.8}}{END_LINES[0]}\n")
ass += (f"Dialogue: 1,{ts(END_TEXT_IN + 0.5)},{ts(END_TEXT_OUT)},End2,,0,0,0,,"
        f"{{\\pos({W//2},{H//2 + 60})\\fad(600,500)\\blur0.6}}{END_LINES[1]} {HEART}\n")
ass_path = os.path.join(OUT, "amma_chethi_vanta_te.ass")
open(ass_path, "w", encoding="utf-8").write(ass)

# plain SRT (subtitles only) for other editors / YouTube
def srt_ts(t):
    return f"{int(t // 3600):02d}:{int(t % 3600 // 60):02d}:{int(t % 60):02d},{int(round((t % 1) * 1000)):03d}"
with open(os.path.join(OUT, "amma_chethi_vanta_te.srt"), "w", encoding="utf-8") as fh:
    for i, (s, e, who, text, _) in enumerate(CUES, 1):
        fh.write(f"{i}\n{srt_ts(s)} --> {srt_ts(e)}\n{text}\n\n")

# ------------------------------------------------------------ dissolve chain + final
inputs, fc, last = [], "", "[0:v]"
for i, (no, path, x_in) in enumerate(segs):
    inputs += ["-i", path]
inputs += ["-i", card]
chain = [(STARTS[no], x_in) for no, _, x_in in segs[1:]] + [(FILM_BODY, X8)]
for k, (start, x) in enumerate(chain, 1):
    nxt = f"[{k}:v]"
    lab = f"[x{k}]"
    fc += f"{last}{nxt}xfade=transition=fade:duration={x}:offset={start - x:.3f}{lab};"
    last = lab
bed = os.path.join(WORK, "bed.wav")
fc += (f"{last}fade=t=in:st=0:d=0.8,ass={ass_path}:shaping=complex,"
       f"trim=duration={TOTAL},setpts=PTS-STARTPTS,format=yuv420p[v]")
final = os.path.join(OUT, "Amma_Chethi_Vanta_v1_music_sfx_subs_1080p.mp4")
run(["ffmpeg", "-v", "error", "-y", *inputs, "-i", bed, "-filter_complex", fc,
     "-map", "[v]", "-map", f"{len(segs) + 1}:a", "-r", str(FPS),
     "-c:v", "libx264", "-crf", "18", "-preset", "slow", "-profile:v", "high", "-pix_fmt", "yuv420p",
     "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-t", str(TOTAL), "-movflags", "+faststart", final])
print("FINAL:", final, dur(final))
