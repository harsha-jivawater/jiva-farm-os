import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ className = "", priority = false }: BrandLogoProps) {
  return (
    <Image
      alt="Jiva Water"
      className={["h-auto object-contain", className].join(" ")}
      height={300}
      priority={priority}
      src="/jiva-water-logo.jpeg"
      width={1200}
    />
  );
}
