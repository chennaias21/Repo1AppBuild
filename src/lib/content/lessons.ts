import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import type { ReactElement } from "react";
import { mdxComponents, slugify } from "@/components/lesson/mdx";
import type { QuizQuestion } from "@/lib/quiz";

const CONTENT = path.join(/*turbopackIgnore: true*/ process.cwd(), "content");

export interface LessonFrontmatter {
  id: string;
  module: number;
  lesson: number;
  slug: string;
  title: string;
  shortTitle: string;
  stage: string;
  durationMin: number;
  access: "free" | "paid";
  objectives: string[];
  keys?: string[];
  datasets?: string[];
  starterFile?: string;
  solutionFile?: string;
  functions?: string[];
  excelVersion?: string;
  shotCount?: number;
  prev: string | null;
  next: string | null;
  videoUrl?: string | null;
  // Project-only fields
  type?: "project";
  estimatedMin?: number;
  skillsUsed?: string[];
  lessonsApplied?: string[];
}

export interface TocItem {
  id: string;
  title: string;
}

function readFile(dir: "lessons" | "projects", file: string) {
  const full = path.join(CONTENT, dir, file);
  if (!fs.existsSync(full)) return null;
  const { data, content } = matter(fs.readFileSync(full, "utf8"));
  return { frontmatter: data as LessonFrontmatter, body: content };
}

/** Frontmatter only: safe to call for locked lessons, because it never touches the body. */
export function readFrontmatter(dir: "lessons" | "projects", file: string): LessonFrontmatter | null {
  return readFile(dir, file)?.frontmatter ?? null;
}

/**
 * Pulls `export const quiz = [...]` out of the MDX body. MDX compiled at runtime
 * cannot export values, so the array is evaluated here and handed to <Quiz /> through context.
 */
export function extractQuiz(body: string): { quiz: QuizQuestion[] | null; rest: string } {
  const start = body.search(/export\s+const\s+quiz\s*=\s*\[/);
  if (start === -1) return { quiz: null, rest: body };

  const open = body.indexOf("[", start);
  let depth = 0;
  let quote: string | null = null;
  let escaped = false;
  for (let j = open; j < body.length; j++) {
    const c = body[j];
    if (quote) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") quote = c;
    else if (c === "[") depth++;
    else if (c === "]" && --depth === 0) {
      let end = j + 1;
      if (body[end] === ";") end++;
      try {
        // Content authored and committed by the course owner, not user input.
        const quiz = new Function(`return (${body.slice(open, j + 1)})`)() as QuizQuestion[];
        return { quiz, rest: body.slice(0, start) + body.slice(end) };
      } catch {
        return { quiz: null, rest: body.slice(0, start) + body.slice(end) };
      }
    }
  }
  return { quiz: null, rest: body };
}

export function tableOfContents(body: string): TocItem[] {
  return body
    .replace(/```[\s\S]*?```/g, "")
    .split("\n")
    .filter((l) => /^##\s+/.test(l))
    .map((l) => l.replace(/^##\s+/, "").trim())
    .map((title) => ({ id: slugify(title), title }));
}

export interface LoadedDocument {
  frontmatter: LessonFrontmatter;
  content: ReactElement;
  quiz: QuizQuestion[] | null;
  toc: TocItem[];
}

/** Removes the "Solution walkthrough" section so it is never sent to learners whose plan excludes it. */
export function withoutSolution(body: string): string {
  const lines = body.split("\n");
  const out: string[] = [];
  let skipping = false;
  for (const line of lines) {
    if (/^##\s+/.test(line)) skipping = /^##\s+solution walkthrough/i.test(line);
    if (!skipping) out.push(line);
  }
  return out.join("\n");
}

export async function loadDocument(
  dir: "lessons" | "projects",
  file: string,
  options: { hideSolution?: boolean } = {}
): Promise<LoadedDocument | null> {
  const raw = readFile(dir, file);
  if (!raw) return null;

  const body = options.hideSolution ? withoutSolution(raw.body) : raw.body;
  const { quiz, rest } = extractQuiz(body);
  // If the author did not place <Quiz /> themselves, render it at the end under "## Quiz".
  const source = quiz && !/<Quiz\b/.test(rest) ? `${rest.trimEnd()}\n\n<Quiz />\n` : rest;

  const { content } = await compileMDX({
    source,
    components: mdxComponents,
    options: { scope: { quiz: quiz ?? [] }, mdxOptions: { remarkPlugins: [remarkGfm] } },
  });

  return { frontmatter: raw.frontmatter, content, quiz, toc: tableOfContents(body) };
}
