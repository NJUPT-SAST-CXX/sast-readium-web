import { processEmojis, getEmoji, searchEmojis } from "./emoji";

describe("emoji utilities", () => {
  describe("processEmojis", () => {
    it("should replace emoji shortcodes with actual emojis", () => {
      expect(processEmojis("Hello :smile:")).toBe("Hello 😄");
      expect(processEmojis(":heart: love :heart:")).toBe("❤️ love ❤️");
    });

    it("should handle multiple different emojis", () => {
      expect(processEmojis(":smile: :heart: :star:")).toBe("😄 ❤️ ⭐");
    });

    it("should preserve unknown shortcodes", () => {
      expect(processEmojis(":unknown_emoji:")).toBe(":unknown_emoji:");
    });

    it("should handle text without emojis", () => {
      expect(processEmojis("No emojis here")).toBe("No emojis here");
    });

    it("should handle empty string", () => {
      expect(processEmojis("")).toBe("");
    });

    it("should be case insensitive", () => {
      expect(processEmojis(":SMILE:")).toBe("😄");
      expect(processEmojis(":Smile:")).toBe("😄");
    });

    it("should handle +1 and -1 emojis", () => {
      expect(processEmojis(":+1:")).toBe("👍");
      expect(processEmojis(":-1:")).toBe("👎");
    });
  });

  describe("getEmoji", () => {
    it("should return emoji for valid shortcode", () => {
      expect(getEmoji("smile")).toBe("😄");
      expect(getEmoji("heart")).toBe("❤️");
    });

    it("should return undefined for invalid shortcode", () => {
      expect(getEmoji("invalid")).toBeUndefined();
    });

    it("should be case insensitive", () => {
      expect(getEmoji("SMILE")).toBe("😄");
    });
  });

  describe("searchEmojis", () => {
    it("should find emojis by partial name", () => {
      const results = searchEmojis("heart");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.code === "heart")).toBe(true);
    });

    it("should limit results", () => {
      const results = searchEmojis("a", 5);
      expect(results.length).toBeLessThanOrEqual(5);
    });

    it("should return empty array for no matches", () => {
      const results = searchEmojis("xyznonexistent");
      expect(results).toEqual([]);
    });
  });
});
