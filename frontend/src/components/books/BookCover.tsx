"use client";

interface BookCoverProps {
  title: string;
  author?: string;
  coverColor: string;
  coverEmoji: string;
  coverUrl?: string | null;
  className?: string;
}

/** Renders a book cover: either a real image (if coverUrl) or a colored art cover with emoji + title. */
export default function BookCover({ title, author, coverColor, coverEmoji, coverUrl, className = "" }: BookCoverProps) {
  if (coverUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={coverUrl}
        alt={title}
        className={`w-full h-full object-cover ${className}`}
      />
    );
  }

  // Show only first 4 words for cover display (like the design mockup)
  const coverTitle = title.split(" ").slice(0, 4).join(" ");

  return (
    <div
      className={`relative w-full h-full flex flex-col overflow-hidden ${className}`}
      style={{ backgroundColor: coverColor, aspectRatio: "3/4" }}
    >
      {/* Book spine — translucent dark, w-3 */}
      <div className="absolute inset-y-0 left-0 w-3" style={{ backgroundColor: "rgba(0,0,0,0.25)" }} />

      {/* Top shimmer gradient */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.12) 0%, transparent 60%)" }} />

      {/* Bottom shadow */}
      <div className="absolute inset-x-0 bottom-0 h-1/3" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)" }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full px-4 py-5 justify-between">
        <div>
          <div className="text-2xl mb-2 opacity-90">{coverEmoji}</div>
          <p
            className="font-black leading-tight text-sm text-white"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
          >
            {coverTitle}
          </p>
        </div>
        <p className="text-xs font-semibold opacity-60 text-white truncate">{author ?? title}</p>
      </div>
    </div>
  );
}


