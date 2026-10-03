import fs from "node:fs";
import path from "node:path";
import Image from "next/image";

/** Cell counts per step, left to right: the logo's four stepped "Excel sheet" bars. */
const STEPS = [
  { x: 5, y: 247, w: 97, h: 86, fill: "#004080", cells: 1 },
  { x: 100, y: 206, w: 97, h: 127, fill: "#1888d0", cells: 2 },
  { x: 198, y: 160, w: 99, h: 173, fill: "#089898", cells: 3 },
  { x: 297, y: 100, w: 103, h: 233, fill: "#f88c10", cells: 4 },
];

/** Vector redraw of the SkillSopan mark, used until the original PNG is placed in public/brand/. */
export function LogoMark({ className = "h-9 w-auto" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 405 340"
      className={className}
      role="img"
      aria-label="SkillSopan: a person climbing four steps"
    >
      {STEPS.map((step) => (
        <g key={step.x}>
          <rect x={step.x} y={step.y} width={step.w} height={step.h} rx={9} fill={step.fill} />
          {Array.from({ length: step.cells }).map((_, i) => (
            <rect
              key={i}
              x={step.x + 9}
              y={323 - i * 49 - 39}
              width={step.w - 18}
              height={39}
              rx={2}
              fill="#f7fafd"
            />
          ))}
        </g>
      ))}
      <circle cx="208" cy="28" r="21" fill="#004080" />
      <g stroke="#004080" strokeWidth="19" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M196 72 L150 135" />
        <path d="M150 135 L112 185" />
        <path d="M150 135 L205 122 L214 158" />
        <path d="M188 78 L238 98 L262 92" />
        <path d="M186 80 L128 96" />
      </g>
    </svg>
  );
}

const PNG = path.join(process.cwd(), "public", "brand", "logo-skillsopan.png");

export default function Logo({ className = "h-9" }: { className?: string }) {
  if (fs.existsSync(PNG)) {
    return (
      <span className="logo-tile inline-flex">
        <Image
          src="/brand/logo-skillsopan.png"
          alt="SkillSopan"
          width={1153}
          height={326}
          priority
          className={`${className} w-auto`}
        />
      </span>
    );
  }

  return (
    <span className="logo-tile inline-flex items-center gap-2" aria-label="SkillSopan">
      <LogoMark className={className} />
      <span className="text-[1.6rem] font-bold leading-none tracking-tight" aria-hidden="true">
        <span style={{ color: "#004080" }}>Skill</span>
        <span style={{ color: "#f06808" }}>Sopan</span>
      </span>
    </span>
  );
}
