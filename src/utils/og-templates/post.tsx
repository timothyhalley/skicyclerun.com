import { SkiCycleRunConfig } from "skicyclerun.config";
import type { CollectionEntry } from "astro:content";

export default (post: CollectionEntry<"blog" | "tech">, siteOrigin: string) => {
  const getAbsoluteUrl = (src: string) =>
    src.startsWith("http")
      ? src
      : `${siteOrigin.replace(/\/$/, "")}/${src.replace(/^\/?/, "")}`;

  const cover = post.data.cover
    ? typeof post.data.cover === "string"
      ? getAbsoluteUrl(post.data.cover)
      : getAbsoluteUrl(post.data.cover.src)
    : null;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: cover
          ? `url(${cover}) center/cover no-repeat`
          : "linear-gradient(135deg, #fefbfb 60%, #ecebeb 100%)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          width: "80%",
          minHeight: "60%",
          padding: "2rem 3rem",
          background: "rgba(255,255,255,0.85)",
          borderRadius: "2rem",
          border: "4px solid #000",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        }}
      >
        {/* Site name in upper right */}
        <div
          style={{
            position: "absolute",
            top: 20,
            right: 32,
            fontSize: 18,
            fontWeight: 400,
            color: "#aaa",
            opacity: 0.7,
            letterSpacing: 1,
            textAlign: "right",
          }}
        >
          {SkiCycleRunConfig.title}
        </div>
        {/* Title */}
        <div
          style={{
            fontSize: 60,
            fontWeight: 800,
            color: "#1e0d51",
            marginBottom: "1.2rem",
            lineHeight: 1.1,
            textShadow: "0 2px 8px rgba(0,0,0,0.12)",
            maxHeight: "60%",
            overflow: "hidden",
          }}
        >
          {post.data.title}
        </div>
        {/* Description */}
        <div
          style={{
            fontSize: 28,
            color: "#555",
            marginBottom: "1.2rem",
            fontWeight: 500,
            maxWidth: "90%",
            lineHeight: 1.3,
            wordBreak: "break-word",
          }}
        >
          {post.data.description}
        </div>
        {/* Author and Date row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            fontSize: 28,
            color: "#333",
            fontWeight: 600,
            marginTop: "auto",
          }}
        >
          <span>
            by {post.data.author}
          </span>
          <span style={{ textAlign: "right", fontSize: 24, color: "#888", fontWeight: 500 }}>
            {post.data.pubDatetime &&
              new Date(post.data.pubDatetime).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};