import type { Channel } from "./types"

export function parseM3U(content: string): Channel[] {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line)
  const channels: Channel[] = []

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("#EXTINF:")) {
      const extinf = lines[i]
      const url = lines[i + 1]

      if (url && !url.startsWith("#")) {
        const channel = parseEXTINF(extinf, url)
        if (channel) {
          channels.push(channel)
        }
        i++ // Skip the URL line
      }
    }
  }

  return channels
}

function parseEXTINF(extinfLine: string, url: string): Channel | null {
  try {
    // Extract tvg-id
    const idMatch = extinfLine.match(/tvg-id="([^"]*)"/)
    const tvgId = idMatch ? idMatch[1] : ""

    // Extract tvg-name
    const nameMatch = extinfLine.match(/tvg-name="([^"]*)"/)
    const tvgName = nameMatch ? nameMatch[1] : ""

    // Extract tvg-logo
    const logoMatch = extinfLine.match(/tvg-logo="([^"]*)"/)
    const tvgLogo = logoMatch ? logoMatch[1] : ""

    // Extract group-title
    const groupMatch = extinfLine.match(/group-title="([^"]*)"/)
    const groupTitle = groupMatch ? groupMatch[1] : "No Group"

    // The title is at the end after the last comma
    const titleMatch = extinfLine.match(/,(.*)$/)
    const title = titleMatch ? titleMatch[1].trim() : tvgName || "No title"

    return {
      title,
      tvgId,
      tvgName,
      tvgLogo,
      groupTitle: groupTitle || "No Group", // Ensure empty group titles are replaced with "No Group"
      url: url.trim(),
    }
  } catch (error) {
    console.error("Error parsing EXTINF line:", extinfLine, error)
    return null
  }
}
