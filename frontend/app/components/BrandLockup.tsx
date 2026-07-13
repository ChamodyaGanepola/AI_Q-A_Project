"use client";

export default function BrandLockup({
  subtitle,
  compact = false,
}: {
  subtitle?: string;
  compact?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 ${compact ? "" : "mb-1"}`}>
      <div className="brand-mark" aria-hidden>
        Q
      </div>
      <div className="min-w-0">
        <p className={`brand-title ${compact ? "!text-xl" : ""}`}>Q&A with AI</p>
        {subtitle ? (
          <p className="text-sm text-[#5b737c] mt-0.5 leading-snug">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
