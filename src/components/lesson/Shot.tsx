import fs from "node:fs";
import path from "node:path";
import ZoomImage from "@/components/lesson/ZoomImage";

interface IndexEntry {
  type?: string;
  caption?: string;
  alt?: string;
  note?: string;
}

let indexCache: Record<string, IndexEntry> | null = null;
function shotIndex(): Record<string, IndexEntry> {
  if (indexCache) return indexCache;
  try {
    indexCache = JSON.parse(fs.readFileSync(path.join(/*turbopackIgnore: true*/ process.cwd(), "data", "screenshot-index.json"), "utf8"));
  } catch {
    indexCache = {};
  }
  return indexCache!;
}

/** "3.3.1" -> /screenshots/module-03/vis-3-3-1.png. Authors never write paths. */
export function shotFile(id: string): { url: string; disk: string } {
  const [mod, les, n] = id.split(".");
  const rel = `module-${mod.padStart(2, "0")}/vis-${mod}-${les}-${n}.png`;
  return { url: `/screenshots/${rel}`, disk: path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "screenshots", rel) };
}

/** Reads width/height from the PNG header so images reserve space and the page never jumps. */
function pngSize(file: string): { width: number; height: number } | null {
  try {
    const fd = fs.openSync(file, "r");
    const buf = Buffer.alloc(24);
    fs.readSync(fd, buf, 0, 24, 0);
    fs.closeSync(fd);
    if (buf.toString("ascii", 1, 4) !== "PNG") return null;
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  } catch {
    return null;
  }
}

const WIDTHS = { sm: "max-w-md", standard: "max-w-3xl", full: "max-w-none" } as const;

export function Shot({
  id,
  size = "standard",
  zoom = true,
  alt,
}: {
  id: string;
  size?: "sm" | "full" | "standard";
  zoom?: boolean;
  alt?: string;
}) {
  const entry = shotIndex()[id] ?? {};
  const { url, disk } = shotFile(id);
  const dims = fs.existsSync(disk) ? pngSize(disk) : null;
  const altText = alt ?? entry.alt ?? entry.caption ?? `Screenshot ${id} from this lesson`;

  if (!dims) {
    return (
      <figure className={`my-6 ${WIDTHS[size]}`}>
        <div
          role="img"
          aria-label={`Screenshot ${id} has not been captured yet`}
          className="flex min-h-40 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-key-edge bg-tint px-6 py-8 text-center"
        >
          <span className="font-mono text-sm font-semibold text-heading">Screenshot {id}</span>
          {entry.type && <span className="text-xs uppercase tracking-wider text-muted">{entry.type}</span>}
          <span className="text-sm text-muted">{entry.note ?? "Not captured yet"}</span>
        </div>
      </figure>
    );
  }

  return (
    <figure className={`my-6 ${WIDTHS[size]}`}>
      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
        <ZoomImage
          src={url}
          alt={altText}
          width={dims.width}
          height={dims.height}
          zoom={zoom}
          sizes="(min-width: 1024px) 760px, 100vw"
        />
      </div>
      {entry.caption && <figcaption className="mt-2 text-sm text-muted">{entry.caption}</figcaption>}
    </figure>
  );
}

/** Before/after side by side; stacks on narrow screens. */
export function ShotPair({ a, b }: { a: string; b: string }) {
  return (
    <div className="my-6 grid gap-4 sm:grid-cols-2">
      <div className="[&_figure]:my-0 [&_figure]:max-w-none">
        <Shot id={a} size="full" />
      </div>
      <div className="[&_figure]:my-0 [&_figure]:max-w-none">
        <Shot id={b} size="full" />
      </div>
    </div>
  );
}
