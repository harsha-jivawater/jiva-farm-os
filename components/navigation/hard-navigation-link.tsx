"use client";

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";

type HardNavigationLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
> & {
  children: ReactNode;
  href: string;
};

export function HardNavigationLink({
  children,
  href,
  onClick,
  target,
  ...props
}: HardNavigationLinkProps) {
  return (
    <a
      {...props}
      href={href}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event);

        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          target === "_blank"
        ) {
          return;
        }

        event.preventDefault();
        window.location.assign(href);
      }}
      target={target}
    >
      {children}
    </a>
  );
}
