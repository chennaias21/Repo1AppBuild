#!/usr/bin/env node
/**
 * npm run validate:content
 * Implements CONTENT-SCHEMA.md section 15 against data/curriculum.json.
 * Errors fail the run; warnings (e.g. screenshots not yet captured) do not.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const LESSON_DIR = path.join(ROOT, "content", "lessons");
const PROJECT_DIR = path.join(ROOT, "content", "projects");
const ASSESS_DIR = path.join(ROOT, "content", "assessments");
const SHOT_DIR = path.join(ROOT, "public", "screenshots");

// Block order per CONTENT-SCHEMA.md section 5. (The prose there says "six blocks" but lists seven headings.)
const LESSON_BLOCKS = ["Why this matters", "How it works", "Do it", "Shortcuts", "Watch out", "Practice", "Quiz"];
const PROJECT_BLOCKS = ["The brief", "What you'll build", "The data", "Milestones", "Solution walkthrough", "How this is marked"];
const QUESTION_TYPES = ["mcq", "truefalse", "formula", "scenario", "decision"];
const REQUIRED_LESSON_FIELDS = [
  "id", "module", "lesson", "slug", "title", "shortTitle", "stage", "durationMin", "access",
  "objectives", "excelVersion", "shotCount", "prev", "next", "videoUrl",
];
const REQUIRED_PROJECT_FIELDS = ["id", "module", "type", "slug", "title", "shortTitle", "stage", "estimatedMin", "access", "shotCount", "prev", "next"];
const WORD_EXCEPTIONS = { "6.7": 1300, "8.2": 1200, "8.6": 1200, "8.7": 1300, "8.8": 1300 };
const WARN_WORDS = 1000;
const FAIL_WORDS = 1150;

const errors = [];
const warnings = [];
const ok = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const curriculumPath = path.join(ROOT, "data", "curriculum.json");
if (!fs.existsSync(curriculumPath)) {
  console.error("✗ data/curriculum.json is missing");
  process.exit(1);
}
const curriculum = JSON.parse(fs.readFileSync(curriculumPath, "utf8"));

let shotIndex = null;
const shotIndexPath = path.join(ROOT, "data", "screenshot-index.json");
if (fs.existsSync(shotIndexPath)) shotIndex = JSON.parse(fs.readFileSync(shotIndexPath, "utf8"));

/** Pulls `export const quiz = [ ... ]` out of an MDX body and evaluates the array literal. */
export function extractQuiz(body) {
  const start = body.search(/export\s+const\s+quiz\s*=\s*\[/);
  if (start === -1) return { quiz: null, start: -1, end: -1 };
  let i = body.indexOf("[", start);
  let depth = 0, inStr = null, escaped = false;
  for (let j = i; j < body.length; j++) {
    const c = body[j];
    if (inStr) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === inStr) inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") inStr = c;
    else if (c === "[") depth++;
    else if (c === "]") {
      depth--;
      if (depth === 0) {
        const literal = body.slice(i, j + 1);
        let end = j + 1;
        if (body[end] === ";") end++;
        try {
          // Repository content authored by the owner; evaluated only to inspect its shape.
          return { quiz: new Function(`return (${literal})`)(), start, end };
        } catch (e) {
          return { quiz: undefined, start, end, error: e.message };
        }
      }
    }
  }
  return { quiz: undefined, start, end: -1, error: "unbalanced brackets" };
}

function proseWordCount(body) {
  const { start, end } = extractQuiz(body);
  let text = start === -1 ? body : body.slice(0, start) + body.slice(end === -1 ? body.length : end);
  text = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^\s*\|.*\|\s*$/gm, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[`*_#>]/g, " ");
  return text.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
}

function headings(body) {
  const lines = body.replace(/```[\s\S]*?```/g, "").split("\n");
  return lines.filter((l) => /^##\s+/.test(l)).map((l) => l.replace(/^##\s+/, "").trim());
}

function shotIds(body) {
  const ids = [];
  for (const m of body.matchAll(/<Shot\s+[^>]*?id="([\d.]+[a-z]?)"/g)) ids.push(m[1]);
  for (const m of body.matchAll(/<ShotPair\s+[^>]*?a="([\d.]+[a-z]?)"[^>]*?b="([\d.]+[a-z]?)"/g)) ids.push(m[1], m[2]);
  return ids;
}

function shotPath(id) {
  const [mod, les, n] = id.split(".");
  return path.join(SHOT_DIR, `module-${String(mod).padStart(2, "0")}`, `vis-${mod}-${les}-${n}.png`);
}

function checkQuiz(label, quiz, expected, typesSeen) {
  if (!Array.isArray(quiz)) return err(`${label}: quiz export could not be parsed`);
  if (quiz.length !== expected) err(`${label}: has ${quiz.length} quiz questions, expected ${expected}`);
  const types = quiz.map((q) => q.type);
  types.forEach((t) => {
    if (!QUESTION_TYPES.includes(t)) err(`${label}: unknown question type "${t}"`);
    typesSeen.add(t);
  });
  if (expected === 3 && new Set(types).size !== types.length) err(`${label}: two quiz questions share a type (${types.join(", ")})`);
  quiz.forEach((q, i) => {
    if (!q.explanation || !String(q.explanation).trim()) err(`${label}: quiz question ${i + 1} has no explanation`);
    if (!q.question) err(`${label}: quiz question ${i + 1} has no question text`);
    if (q.type === "formula" && !(Array.isArray(q.accept) && q.accept.length)) err(`${label}: formula question ${i + 1} needs an accept array`);
    if ((q.type === "mcq" || q.type === "scenario" || q.type === "decision") && !(Array.isArray(q.options) && q.options.length >= 2 && Number.isInteger(q.correct))) {
      err(`${label}: question ${i + 1} (${q.type}) needs options and a numeric correct index`);
    }
    if (q.type === "truefalse" && typeof q.correct !== "boolean") err(`${label}: true/false question ${i + 1} needs a boolean correct`);
  });
}

// ---- 1. curriculum integrity ---------------------------------------------------
const lessons = curriculum.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleNumber: m.number })));
const projects = curriculum.modules.flatMap((m) => (m.projects ?? []).map((p) => ({ ...p, moduleNumber: m.number })));
const ids = lessons.map((l) => l.id);

if (new Set(ids).size !== ids.length) err("curriculum.json: duplicate lesson IDs");
if (lessons.length !== curriculum.course.totalLessons) err(`curriculum.json: lists ${lessons.length} lessons but course.totalLessons is ${curriculum.course.totalLessons}`);
if (projects.length !== curriculum.course.totalProjects) err(`curriculum.json: lists ${projects.length} projects but course.totalProjects is ${curriculum.course.totalProjects}`);
const freeCount = lessons.filter((l) => l.access === "free").length;
if (freeCount !== curriculum.course.freeLessons) err(`curriculum.json: ${freeCount} lessons are free but course.freeLessons is ${curriculum.course.freeLessons}`);

lessons.forEach((l, i) => {
  const expectPrev = i === 0 ? null : ids[i - 1];
  const expectNext = i === lessons.length - 1 ? null : ids[i + 1];
  if (l.prev !== expectPrev) err(`curriculum.json: lesson ${l.id} prev is ${l.prev}, expected ${expectPrev}`);
  if (l.next !== expectNext) err(`curriculum.json: lesson ${l.id} next is ${l.next}, expected ${expectNext}`);
});
if (!errors.length) ok.push(`${lessons.length} lessons + ${projects.length} projects in curriculum.json; prev/next chain unbroken`);

// ---- 2. lessons ------------------------------------------------------------------
const typesByModule = new Map();
let missingFiles = 0;
let shotsExpected = 0;
let shotsMissing = 0;

for (const l of lessons) {
  const label = `Lesson ${l.id}`;
  const file = path.join(LESSON_DIR, l.file);
  if (!fs.existsSync(file)) {
    missingFiles++;
    err(`${label}: file content/lessons/${l.file} not found`);
    continue;
  }
  const { data: fm, content: body } = matter(fs.readFileSync(file, "utf8"));

  for (const f of REQUIRED_LESSON_FIELDS) if (!(f in fm)) err(`${label}: frontmatter missing "${f}"`);
  if (fm.id !== undefined && String(fm.id) !== l.id) err(`${label}: frontmatter id "${fm.id}" does not match curriculum.json`);
  if (fm.slug && fm.slug !== l.slug) err(`${label}: frontmatter slug "${fm.slug}" does not match curriculum.json "${l.slug}"`);
  if (fm.access && fm.access !== l.access) err(`${label}: frontmatter access "${fm.access}" does not match curriculum.json "${l.access}"`);
  if ("prev" in fm && fm.prev !== l.prev) err(`${label}: frontmatter prev "${fm.prev}" does not match curriculum.json "${l.prev}"`);
  if ("next" in fm && fm.next !== l.next) err(`${label}: frontmatter next "${fm.next}" does not match curriculum.json "${l.next}"`);
  if (Array.isArray(fm.objectives) && (fm.objectives.length < 2 || fm.objectives.length > 3)) warn(`${label}: ${fm.objectives.length} objectives (schema says 2-3)`);

  const hs = headings(body);
  if (JSON.stringify(hs) !== JSON.stringify(LESSON_BLOCKS)) err(`${label}: blocks are [${hs.join(" | ")}], expected [${LESSON_BLOCKS.join(" | ")}]`);

  const { quiz } = extractQuiz(body);
  const seen = typesByModule.get(l.moduleNumber) ?? new Set();
  typesByModule.set(l.moduleNumber, seen);
  if (quiz === null) err(`${label}: no "export const quiz" found`);
  else checkQuiz(label, quiz, 3, seen);

  const words = proseWordCount(body);
  const cap = WORD_EXCEPTIONS[l.id] ?? FAIL_WORDS;
  if (words > cap) err(`${label}: ${words} prose words exceeds the ${cap} limit`);
  else if (words > (WORD_EXCEPTIONS[l.id] ?? WARN_WORDS)) warn(`${label}: ${words} prose words (target 700-1000)`);

  const shots = shotIds(body);
  if (typeof fm.shotCount === "number" && shots.length !== fm.shotCount) err(`${label}: shotCount is ${fm.shotCount} but the body has ${shots.length} Shot markers`);
  for (const id of shots) {
    shotsExpected++;
    if (!id.startsWith(`${l.id}.`)) err(`${label}: Shot ${id} does not belong to this lesson`);
    if (shotIndex && !(id in shotIndex)) err(`${label}: Shot ${id} is not in screenshot-index.json`);
    if (!fs.existsSync(shotPath(id))) shotsMissing++;
  }
}

if (missingFiles === 0) ok.push("All lesson files present, frontmatter complete, blocks in order");

for (const [mod, seen] of typesByModule) {
  const missing = QUESTION_TYPES.filter((t) => !seen.has(t));
  if (missing.length) err(`Module ${mod}: quiz types never used across the module's lessons: ${missing.join(", ")}`);
}

// ---- 3. projects -------------------------------------------------------------------
for (const p of projects) {
  const label = `Project ${p.id}`;
  const file = path.join(PROJECT_DIR, p.file);
  if (!fs.existsSync(file)) {
    err(`${label}: file content/projects/${p.file} not found`);
    continue;
  }
  const { data: fm, content: body } = matter(fs.readFileSync(file, "utf8"));
  for (const f of REQUIRED_PROJECT_FIELDS) if (!(f in fm)) err(`${label}: frontmatter missing "${f}"`);
  if (fm.type !== "project") err(`${label}: frontmatter type must be "project"`);
  const hs = headings(body);
  if (JSON.stringify(hs) !== JSON.stringify(PROJECT_BLOCKS)) err(`${label}: blocks are [${hs.join(" | ")}], expected [${PROJECT_BLOCKS.join(" | ")}]`);
  if (extractQuiz(body).start !== -1) err(`${label}: projects must not contain a quiz`);
}

// ---- 4. assessments ----------------------------------------------------------------
for (const m of curriculum.modules) {
  const label = `Assessment ${m.assessment}`;
  const file = path.join(ASSESS_DIR, m.assessment);
  if (!fs.existsSync(file)) {
    warn(`${label}: not found yet (module assessments are written separately)`);
    continue;
  }
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    err(`${label}: invalid JSON (${e.message})`);
    continue;
  }
  const qs = Array.isArray(data) ? data : data.questions;
  const seen = new Set();
  checkQuiz(label, qs, 15, seen);
  const missing = QUESTION_TYPES.filter((t) => !seen.has(t));
  if (missing.length) err(`${label}: question types never used: ${missing.join(", ")}`);
}

// ---- report ------------------------------------------------------------------------
for (const line of ok) console.log(`✓ ${line}`);
if (shotsExpected > 0) {
  if (shotsMissing) console.log(`⚠ ${shotsMissing} of ${shotsExpected} screenshots not yet captured (they render as placeholders)`);
  else console.log(`✓ All ${shotsExpected} screenshots present`);
}
for (const w of warnings) console.log(`⚠ ${w}`);
for (const e of errors) console.log(`✗ ${e}`);
console.log(`\n${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
