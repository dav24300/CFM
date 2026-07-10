type Props = {
  variant?: "line" | "gold";
  className?: string;
};

export function SectionDivider({ variant = "line", className = "" }: Props) {
  if (variant === "gold") {
    return (
      <div className={`flex justify-center py-8 ${className}`} aria-hidden>
        <div className="h-1 w-16 rounded-full bg-site-primary" />
      </div>
    );
  }

  return (
    <hr className={`border-0 border-t border-site-primary/20 ${className}`} aria-hidden />
  );
}
