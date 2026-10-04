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
        className="h-11 w-auto sm:h-12"
        height={434}
        priority={priority}
        sizes="64px"
        src="/brand/logo-mark.png"
        width={579}
      />
      <span>
        <span className="block font-serif text-2xl leading-none text-foreground sm:text-3xl">
          Thoemia
        </span>
        <span className="mt-2 block text-[10px] uppercase tracking-[0.45em] text-foreground sm:text-xs">
          Intimo
        </span>
      </span>
    </span>
  );
}
