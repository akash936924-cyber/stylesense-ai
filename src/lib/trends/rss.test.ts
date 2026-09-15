import { describe, expect, it } from "vitest";
import { parseRssHeadlines } from "./rss";

const RSS = `<?xml version="1.0"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Vogue</title>
    <item>
      <title>The Capri Pant Is Back</title>
      <link>https://vogue.com/article/capri</link>
      <pubDate>Mon, 13 Jul 2026 10:00:00 GMT</pubDate>
      <media:thumbnail url="https://img.vogue.com/capri.jpg"/>
    </item>
    <item>
      <title><![CDATA[Butter Yellow, Explained]]></title>
      <link>https://vogue.com/article/butter</link>
    </item>
  </channel>
</rss>`;

const ATOM = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>WWW</title>
  <entry>
    <title>Sheer Layering How-To</title>
    <link rel="alternate" href="https://whowhatwear.com/sheer"/>
    <updated>2026-07-12T09:00:00Z</updated>
  </entry>
</feed>`;

describe("parseRssHeadlines", () => {
  it("parses RSS 2.0 items with media thumbnails and CDATA titles", () => {
    const headlines = parseRssHeadlines(RSS, "Vogue");
    expect(headlines).toHaveLength(2);
    expect(headlines[0]).toMatchObject({
      title: "The Capri Pant Is Back",
      link: "https://vogue.com/article/capri",
      source: "Vogue",
      imageUrl: "https://img.vogue.com/capri.jpg",
    });
    expect(headlines[1].title).toBe("Butter Yellow, Explained");
  });

  it("parses Atom entries via alternate links", () => {
    const headlines = parseRssHeadlines(ATOM, "WWW");
    expect(headlines).toHaveLength(1);
    expect(headlines[0].link).toBe("https://whowhatwear.com/sheer");
  });

  it("respects the limit and survives junk", () => {
    expect(parseRssHeadlines(RSS, "Vogue", 1)).toHaveLength(1);
    expect(parseRssHeadlines("<not-xml", "x")).toEqual([]);
    expect(parseRssHeadlines("<html></html>", "x")).toEqual([]);
  });
});
