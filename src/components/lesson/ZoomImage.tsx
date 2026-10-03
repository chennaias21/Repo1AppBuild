"use client";

import Image from "next/image";
import { useRef } from "react";

interface Props {
  src: string;
  alt: string;
  width: number;
  height: number;
  zoom: boolean;
  sizes: string;
}

/** Screenshot with an optional click-to-zoom lightbox built on the native <dialog>. */
export default function ZoomImage({ src, alt, width, height, zoom, sizes }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);

  const img = (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      loading="lazy"
      className="h-auto w-full"
    />
  );

  if (!zoom) return img;

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="block w-full cursor-zoom-in"
        aria-label={`Enlarge screenshot: ${alt}`}
      >
        {img}
      </button>
      <dialog
        ref={dialog}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
        className="m-auto max-h-[94vh] max-w-[96vw] rounded-xl border-0 bg-white p-0 backdrop:bg-black/70"
      >
        <form method="dialog" className="absolute right-2 top-2 z-10">
          <button
            className="rounded-full bg-navy px-3 py-1.5 text-sm font-semibold text-white"
            aria-label="Close enlarged screenshot"
          >
            Close ✕
          </button>
        </form>
        <Image src={src} alt={alt} width={width} height={height} sizes="96vw" className="h-auto max-h-[94vh] w-auto max-w-[96vw] object-contain" />
      </dialog>
    </>
  );
}
