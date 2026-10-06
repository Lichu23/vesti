import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
  variant?: "full" | "lockup";
};

export function BrandLogo({
  className = "",
  priority = false,
  variant = "lockup",
}: BrandLogoProps) {
  if (variant === "full") {
    return (
      <Image
        alt="Thoemia Intimo"
        className={`h-auto ${className}`}
        height={642}
        priority={priority}
        sizes="160px"
        src="/brand/logo.png"
        width={579}
      />
    );
  }

  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <Image
        alt=""
        className="h-9 w-auto md:h-12"
        height={434}
        priority={priority}
        sizes="64px"
        src="/brand/logo-mark.png"
        width={579}
      />
      <span className="hidden md:block">
        <span className="block font-serif text-3xl leading-none text-foreground">
          Thoemia
        </span>
        <span className="mt-2 block text-xs uppercase tracking-[0.45em] text-foreground">
          Intimo
        </span>
      </span>
    </span>
  );
}
