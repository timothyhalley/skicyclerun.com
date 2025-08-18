import { SkiCycleRunConfig } from "skicyclerun.config";
import type { CollectionEntry } from "astro:content";

const postFilter = ({ data }: CollectionEntry<"blog">) => {
  const isPublishTimePassed =
    Date.now() >
    new Date(data.pubDatetime).getTime() - SkiCycleRunConfig.scheduledPostMargin;
  return !data.draft && (import.meta.env.DEV || isPublishTimePassed);
};

export default postFilter;
