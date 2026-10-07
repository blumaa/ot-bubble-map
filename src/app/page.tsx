import categoriesData from "../../data/categories.json";
import curated from "../../data/curated.json";
import recordings from "../../data/recordings.json";
import { BubbleMap } from "@/components/BubbleMap";
import { SiteFooter } from "@/components/SiteFooter";
import type { Group } from "@/lib/keywords";
import { LAYOUT_SIZE, packLayout } from "@/lib/layout";
import { buildHierarchy, groupTunes } from "@/lib/tunes";
import type { Recording } from "@/lib/types";

export default function Home() {
  const tunes = groupTunes(recordings as Recording[]);
  const nodes = packLayout(buildHierarchy(tunes, categoriesData.categories as Group[], curated as Record<string, string>), LAYOUT_SIZE);

  return (
    <main className="font-sans">
      <BubbleMap nodes={nodes} />
      <SiteFooter />
    </main>
  );
}
