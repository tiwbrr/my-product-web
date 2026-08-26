"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

export function HomeHeroMedia({ url, type }: { url: string; type: "image" | "video" }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (type !== "video") return;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePlayback = () => {
      if (motionQuery.matches) videoRef.current?.pause();
      else void videoRef.current?.play().catch(() => undefined);
    };
    updatePlayback();
    motionQuery.addEventListener("change", updatePlayback);
    return () => motionQuery.removeEventListener("change", updatePlayback);
  }, [type]);

  return <div className="sell-hero-media" aria-hidden="true">
    {type === "video"
      ? <video ref={videoRef} src={url} poster="/hero-kuozo-shop.webp" autoPlay muted loop playsInline preload="metadata" />
      : <Image src={url} alt="" fill sizes="100vw" preload />}
    <div className="sell-hero-media-overlay" />
  </div>;
}
