import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ className = "", priority = false }: BrandLogoProps) {
  return (
    <Image
      alt="Jiva Water"
      className={["mx-auto block h-auto max-w-full object-contain", className].join(" ")}
      height={469}
      priority={priority}
      src="/jiva-water-logo.png"
      width={1250}
    />
  );
}
