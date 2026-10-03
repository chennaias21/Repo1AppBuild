import type { NextConfig } from "next";

/**
 * Lessons, projects and assessments are files read from disk at request time.
 * Next.js cannot see that, so on a serverless host (Netlify) they would be left out
 * of the deployed server code and every lesson would say "being finalised".
 * Each route lists the folders it reads so they are packaged with it.
 */
const lessonFiles = ["./content/lessons/**/*", "./data/**/*", "./public/screenshots/**/*", "./public/files/**/*"];
const assessmentFiles = ["./content/assessments/**/*"];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
  outputFileTracingIncludes: {
    "/learn/\\[module\\]/\\[lesson\\]": lessonFiles,
    "/learn/8/project/\\[slug\\]": ["./content/projects/**/*", "./data/**/*", "./public/screenshots/**/*", "./public/files/**/*"],
    "/learn/\\[module\\]/assessment": assessmentFiles,
    "/api/assessment/\\[module\\]": assessmentFiles,
    "/dashboard": assessmentFiles,
    "/certificate": assessmentFiles,
    "/api/certificate": assessmentFiles,
  },
};

export default nextConfig;
