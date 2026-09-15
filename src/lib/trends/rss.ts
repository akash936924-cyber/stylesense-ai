import { XMLParser } from "fast-xml-parser";

/** A headline pulled from a fashion-magazine RSS feed. */
export interface RssHeadline {
  title: string;
  link: string;
  source: string;
  publishedAt?: string;
  imageUrl?: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

function asArray<T>(x: T | T[] | undefined): T[] {
  return x === undefined ? [] : Array.isArray(x) ? x : [x];
}

function text(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "#text" in v) {
    return String((v as Record<string, unknown>)["#text"]);
  }
  return undefined;
}

/** Parse RSS 2.0 or Atom XML into headlines. Returns [] on anything broken. */
export function parseRssHeadlines(xml: string, source: string, limit = 8): RssHeadline[] {
  let doc: Record<string, any>;
  try {
    doc = parser.parse(xml);
  } catch {
    return [];
  }

  // RSS 2.0: rss.channel.item[]; Atom: feed.entry[]
  const rssItems = asArray(doc?.rss?.channel?.item);
  const atomEntries = asArray(doc?.feed?.entry);

  const headlines: RssHeadline[] = [];

  for (const item of rssItems) {
    const title = text(item.title);
    const link = text(item.link);
    if (!title || !link) continue;
    headlines.push({
      title,
      link,
      source,
      publishedAt: text(item.pubDate),
      imageUrl:
        item["media:content"]?.["@_url"] ??
        item["media:thumbnail"]?.["@_url"] ??
        item.enclosure?.["@_url"],
    });
  }

  for (const entry of atomEntries) {
    const title = text(entry.title);
    const links = asArray(entry.link);
    const link =
      links.find((l: any) => l["@_rel"] === "alternate")?.["@_href"] ??
      links[0]?.["@_href"];
    if (!title || !link) continue;
    headlines.push({
      title,
      link,
      source,
      publishedAt: text(entry.updated) ?? text(entry.published),
    });
  }

  return headlines.slice(0, limit);
}
