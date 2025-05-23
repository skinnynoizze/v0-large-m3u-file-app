import type { Channel } from "./types"

export function parseM3U(content: string | null | undefined): Channel[] {
  // Debug logging to identify the issue
  console.log("parseM3U input type:", typeof content)

  // Return empty array if content is undefined, null, or empty
  if (content === undefined || content === null) {
    console.warn("M3U content is undefined or null")
    return []
  }

  if (typeof content !== "string") {
    console.warn("M3U content is not a string:", content)
    return []
  }

  if (content.trim() === "") {
    console.warn("M3U content is empty string")
    return []
  }

  try {
    // Safely split the content into lines
    let lines: string[] = []
    try {
      lines = content.split("\n")
    } catch (error) {
      console.error("Error splitting M3U content:", error)
      return []
    }

    // Filter and trim lines
    lines = lines.map((line) => (typeof line === "string" ? line.trim() : "")).filter((line) => line !== "")

    const channels: Channel[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line && line.startsWith("#EXTINF:")) {
        const extinf = line
        const url = i + 1 < lines.length ? lines[i + 1] : null

        if (url && !url.startsWith("#")) {
          const channel = parseEXTINF(extinf, url)
          if (channel) {
            channels.push(channel)
          }
          i++ // Skip the URL line
        }
      }
    }

    console.log(`Successfully parsed ${channels.length} channels`)
    return channels
  } catch (error) {
    console.error("Error parsing M3U content:", error)
    return []
  }
}

function parseEXTINF(extinfLine: string, url: string): Channel | null {
  try {
    // Ensure both parameters are strings
    if (typeof extinfLine !== "string" || typeof url !== "string") {
      console.warn("Invalid EXTINF line or URL types:", {
        extinfLineType: typeof extinfLine,
        urlType: typeof url,
      })
      return null
    }

    if (!extinfLine || !url) {
      console.warn("Empty EXTINF line or URL")
      return null
    }

    // Extract tvg-id
    const idMatch = extinfLine.match(/tvg-id="([^"]*)"/)
    const tvgId = idMatch && idMatch[1] ? idMatch[1] : ""

    // Extract tvg-name
    const nameMatch = extinfLine.match(/tvg-name="([^"]*)"/)
    const tvgName = nameMatch && nameMatch[1] ? nameMatch[1] : ""

    // Extract tvg-logo
    const logoMatch = extinfLine.match(/tvg-logo="([^"]*)"/)
    const tvgLogo = logoMatch && logoMatch[1] ? logoMatch[1] : ""

    // Extract group-title
    const groupMatch = extinfLine.match(/group-title="([^"]*)"/)
    const groupTitle = groupMatch && groupMatch[1] ? groupMatch[1] : "No Group"

    // The title is at the end after the last comma
    const titleMatch = extinfLine.match(/,(.*)$/)
    const title = titleMatch && titleMatch[1] ? titleMatch[1].trim() : tvgName || "No title"

    return {
      title: title || "No title",
      tvgId: tvgId || "",
      tvgName: tvgName || "",
      tvgLogo: tvgLogo || "",
      groupTitle: groupTitle || "No Group",
      url: url.trim(),
    }
  } catch (error) {
    console.error("Error parsing EXTINF line:", error, { extinfLine, url })
    return null
  }
}
