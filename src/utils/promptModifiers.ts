/**
 * Inserts a quick modifier into a MiniMax-H3 prompt without corrupting
 * official trailing audio/music sections (`overall_soundscape:`, `non_diegetic_music:`).
 */
export function insertQuickModifier(currentPrompt: string, modifierText: string): string {
  const cleanModifier = (modifierText || '').trim();
  if (!cleanModifier) return currentPrompt;

  if (!currentPrompt || !currentPrompt.trim()) {
    return cleanModifier;
  }

  // Music suppression modifier replaces or sets the non_diegetic_music section cleanly
  if (/^non_diegetic_music:/i.test(cleanModifier)) {
    const musicSectionRegex = /(?:^|\r?\n)[ \t]*non_diegetic_music:[\s\S]*$/i;
    if (musicSectionRegex.test(currentPrompt)) {
      return currentPrompt.replace(musicSectionRegex, (match) => {
        const leadingNewline = match.startsWith('\r\n') ? '\r\n' : match.startsWith('\n') ? '\n' : '';
        return `${leadingNewline}${cleanModifier}`;
      });
    }
    return `${currentPrompt.trimEnd()}\n\n${cleanModifier}`;
  }

  // Locate the start of the audio footer (overall_soundscape: or non_diegetic_music:)
  const footerBoundaryRegex = /(?:\r?\n[ \t]*)+(?=(?:overall_soundscape|non_diegetic_music):)/i;
  const match = footerBoundaryRegex.exec(currentPrompt);

  if (match && typeof match.index === 'number') {
    const narrativePart = currentPrompt.slice(0, match.index).trimEnd();
    const footerPart = currentPrompt.slice(match.index);
    if (!narrativePart) {
      return `${cleanModifier}${footerPart}`;
    }
    return `${narrativePart} ${cleanModifier}${footerPart}`;
  }

  // Free-form draft fallback (no official audio footer headers)
  return `${currentPrompt.trimEnd()}\n${cleanModifier}`;
}
