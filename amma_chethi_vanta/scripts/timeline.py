"""Single source of truth for the edit of "అమ్మ చేతి వంట".

All times are in seconds on the FINAL film timeline.
"""
import os

UPLOADS = "/root/.claude/uploads/3872b5e8-063c-5825-bc5d-e4ac351f3fe4"

# (scene no, source file, slot duration, transition INTO NEXT scene, look, slow-zoom)
SCENES = [
    (1, "3aaf134b-415817.mp4", 10, 0.5, "present", False),
    (2, "ec50f3cc-415818.mp4", 10, 0.5, "present", False),
    (3, "01a009e6-415819.mp4", 10, 1.2, "present", False),   # long dissolve into memory
    (4, "09af017e-415821.mp4", 12, 0.6, "memory", False),
    (5, "799c0e78-415822.mp4", 12, 0.6, "memory", False),
    (6, "97864300-415829.mp4", 11, 1.2, "memory", True),     # long dissolve back to present
    (7, "aaff34c6-415831.mp4", 12, 1.2, "present_low", True),
    (8, "12a9aaee-415832.mp4", 13, 1.5, "memory", True), # dissolve into end card
]
TRIM_HEAD = 0.10   # drop first frames (AI-clip start artefacts)
TRIM_TAIL = 0.05
END_CARD = 5.0
FPS = 30
W, H = 1920, 1080

# Scene slot starts
STARTS = {}
t = 0.0
for s in SCENES:
    STARTS[s[0]] = t
    t += s[2]
FILM_BODY = t                       # 90.0
TOTAL = FILM_BODY + END_CARD        # 95.0

# Narration / dialogue cues: (start, end, speaker, text, scene)
# Text is verbatim from the brief; long lines are only split into readable cues.
CUES = [
    (3.8, 6.6, "NARRATOR", "రోజంతా ఆఫీసులో పని చేసి ఇంటికి వచ్చేసరికి...", 1),
    (6.8, 9.4, "NARRATOR", "శరీరం పూర్తిగా అలసిపోయింది.", 1),
    (11.0, 14.8, "NARRATOR", "ఇక రాత్రికి భోజనం కూడా మనమే తయారు చేసుకోవాలి.", 2),
    (24.4, 28.2, "NARRATOR", "ఒక్క పూట వంట చేయడానికే ఇంత సమయం పడుతుందా!", 3),
    (32.3, 35.0, "CHILD", "అమ్మా! మళ్ళీ అవే వంటలా? రోజూ ఇదేనా?", 4),
    (35.1, 37.4, "CHILD", "ఏదైనా స్పెషల్ చేయొచ్చుగా!", 4),
    (37.9, 40.8, "MOTHER", "తిను నాన్నా... ప్రేమగా చేశాను.", 4),
    (42.8, 46.4, "NARRATOR", "అప్పుడు అమ్మ వంట చేయడం మాత్రమే చూశాను...", 5),
    (46.6, 50.2, "NARRATOR", "కానీ ఆ వంటతో పాటు ఇంటి పనులన్నీ ఎలా చూసుకునేదో", 5),
    (50.3, 52.9, "NARRATOR", "ఒక్కసారి కూడా ఆలోచించలేదు.", 5),
    (54.8, 58.2, "NARRATOR", "అమ్మ చేతి వంటలో ఏదో తెలియని రుచి ఉండేది.", 6),
    (58.5, 63.6, "NARRATOR", "ఆ రుచి వెనుక ఎంత ప్రేమ, శ్రమ ఉండేదో ఇప్పుడు తెలుస్తోంది.", 6),
    (66.0, 69.4, "NARRATOR", "ఈరోజు నా చేత్తో వండుకుని తింటుంటే...", 7),
    (69.7, 74.6, "NARRATOR", "అమ్మ పెట్టిన ఆ మామూలు భోజనమే ఎంత ప్రత్యేకమో తెలిసింది.", 7),
    (78.0, 79.4, "NARRATOR", "అమ్మా...", 8),
    (79.6, 82.6, "NARRATOR", "నువ్వు వండింది మామూలు భోజనం కాదు.", 8),
    (83.0, 86.4, "NARRATOR", "నీ సమయాన్ని, నీ శ్రమను, నీ ప్రేమను", 8),
    (86.6, 89.2, "NARRATOR", "మాకు ప్రతిరోజూ వడ్డించావు.", 8),
]

TITLE = (0.4, 3.3, "అమ్మ చేతి వంట")
END_LINES = ("అమ్మ చేతి వంట విలువ...", "మనం వండుకున్నప్పుడే తెలుస్తుంది.")
END_TEXT_IN, END_TEXT_OUT = FILM_BODY + 0.6, TOTAL - 0.6   # ~3.8 s fully visible

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "output")
STEMS = os.path.join(ROOT, "stems")
WORK = os.environ.get("WORK", "/tmp/claude-0/-home-user-Repo1AppBuild/3872b5e8-063c-5825-bc5d-e4ac351f3fe4/scratchpad/work")
os.makedirs(WORK, exist_ok=True)
