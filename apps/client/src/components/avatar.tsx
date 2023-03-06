"use client";

import { useState } from "react";
import Image from "next/image";
import { cx } from "class-variance-authority";

const sizeMap = {
  sm: 24,
  md: 32,
  lg: 40,
  xl: 208,
};

const classSizeMap = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-10 h-10",
  xl: "w-52 h-52",
};

export interface AvatarProps {
  src?: string | null;
  size?: keyof typeof sizeMap;
  className?: string;
  name: string;
  alt?: string;
  title?: string;
}

export default function Avatar({
  src,
  name,
  size = "md",
  alt,
  className,
  title,
}: AvatarProps) {
  const [imageFail, setImageFail] = useState(false);

  const initials = name
    ?.split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("");

  return (
    <span
      title={title}
      className={cx(
        "relative z-0 flex items-center justify-center bg-gray-300 rounded-full select-none dark:bg-gray-700",
        classSizeMap[size],
        className,
      )}
    >
      {src && !imageFail ? (
        <Image
          onError={() => setImageFail(true)}
          className={cx("z-10 object-cover rounded-full", classSizeMap[size])}
          width={sizeMap[size]}
          height={sizeMap[size]}
          src={src}
          alt={alt || name}
        />
      ) : (
        <span className="flex items-center justify-center text-sm font-semibold text-black uppercase dark:text-white grow">
          {initials}
        </span>
      )}
    </span>
  );
}
