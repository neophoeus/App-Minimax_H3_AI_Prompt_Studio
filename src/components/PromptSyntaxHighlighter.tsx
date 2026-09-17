import React from 'react';

interface PromptSyntaxHighlighterProps {
  text: string;
  className?: string;
}

export const PromptSyntaxHighlighter: React.FC<PromptSyntaxHighlighterProps> = ({
  text,
  className = '',
}) => {
  if (!text) return null;

  const formatText = (content: string) => {
    const lines = content.split('\n');

    return lines.map((line, lineIndex) => {
      const trimmed = line.trim();

      // Check for alignment instruction header lines (I2VA, FL2VA, L2VA)
      if (
        trimmed.startsWith('For the target video, at 0.00 seconds') ||
        trimmed.startsWith('How the reference pictures align with the target video')
      ) {
        return (
          <div
            key={lineIndex}
            className="my-1.5 p-2 rounded-lg bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 text-xs font-mono"
          >
            <span className="font-bold text-indigo-400 mr-2">📌 [Alignment Instruction]</span>
            <span>{line}</span>
          </div>
        );
      }

      // Check if the line is an official field header (e.g. integrated_multimodal_description:)
      const isHeaderLine = /^(integrated_multimodal_description|overall_soundscape|non_diegetic_music|subject_definitions|summary|retention_analysis|detailed_description):/i.test(
        trimmed
      );

      if (isHeaderLine) {
        const colonIdx = line.indexOf(':');
        const headerName = line.slice(0, colonIdx + 1);
        const restOfLine = line.slice(colonIdx + 1);

        return (
          <div key={lineIndex} className="min-h-[1.5rem] leading-relaxed my-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/50 shadow-sm mr-2">
              {headerName}
            </span>
            <span className="text-slate-200 font-sans">{restOfLine}</span>
          </div>
        );
      }

      // Process line tokens: <d>...</d>, speaker IDs (S1), <scenetrans>, <cutoff>, <Subject/Picture/Video/Audio>, [Shot N], timecodes, task types, retention markers, quotes
      const tokenRegex = /(<d>\[.*?\][\s\S]*?<\/d>|<d>|<\/d>|<scenetrans>|<cutoff>|\(S\d+(?:,S\d+)*\)|\b(?:fully_preserved|partially_preserved|attribute_transfer|fully_copy|partially_copy|weak_reference)\b|<(?:Subject|Picture|Video|Audio)\s+\d+>|<[^>]+>|\[(?:keyframe completion|reference generation|video editing|video continuation|audio reuse|audio reference)(?:\s*\+\s*(?:keyframe completion|reference generation|video editing|video continuation|audio reuse|audio reference))*\]|\[Shot\s+\d+\]|At\s+\d{2}:\d{2}\.\d{3},?|\[[^\]]+\]|"([^"\\]|\\.)*")/g;

      const tokens = line.split(tokenRegex);

      return (
        <div key={lineIndex} className="min-h-[1.5rem] leading-relaxed font-mono">
          {tokens.map((token, tokenIndex) => {
            if (!token) return null;

            // Spoken dialogue block: <d>[Language] ...</d>
            if (token.startsWith('<d>') && token.endsWith('</d>')) {
              return (
                <span
                  key={tokenIndex}
                  className="inline-flex items-center px-2 py-0.5 mx-1 rounded text-xs font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 shadow-sm"
                  title="MiniMax-H3 官方語音對白標籤 (Verbatim Speech)"
                >
                  <span className="text-emerald-400 font-bold mr-1">💬</span>
                  {token}
                </span>
              );
            }

            // Dialogue boundary tags
            if (token === '<d>' || token === '</d>') {
              return (
                <span
                  key={tokenIndex}
                  className="font-bold text-emerald-400 px-1 bg-emerald-950/60 rounded border border-emerald-500/40"
                >
                  {token}
                </span>
              );
            }

            // Dialogue continuity tags: <scenetrans>, <cutoff>
            if (token === '<scenetrans>' || token === '<cutoff>') {
              return (
                <span
                  key={tokenIndex}
                  className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-xs font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-500/50"
                  title="MiniMax-H3 對白跨分鏡延續/截斷標籤"
                >
                  {token}
                </span>
              );
            }

            // Speaker IDs: (S1), (S2), (S1,S2)
            if (/^\(S\d+(?:,S\d+)*\)$/.test(token)) {
              return (
                <span
                  key={tokenIndex}
                  className="inline-flex items-center px-1.5 py-0.2 rounded text-xs font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40 mx-0.5"
                  title="說話者 ID (Speaker ID)"
                >
                  {token}
                </span>
              );
            }

            // Official Ref2VA retention markers
            if (
              /^(fully_preserved|partially_preserved|attribute_transfer|fully_copy|partially_copy|weak_reference)$/.test(
                token
              )
            ) {
              return (
                <span
                  key={tokenIndex}
                  className="inline-flex items-center px-1.5 py-0.2 rounded text-xs font-mono font-semibold bg-teal-950/90 text-teal-300 border border-teal-500/50 mx-0.5"
                >
                  {token}
                </span>
              );
            }

            // Highlight reference tags (<Subject 1>, <Picture 1>, <Video 1>, <Audio 1>)
            if (/^<(?:Subject|Picture|Video|Audio)\s+\d+>$/i.test(token)) {
              return (
                <span
                  key={tokenIndex}
                  className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-xs font-mono font-bold bg-purple-950/90 text-purple-300 border border-purple-500/50"
                >
                  {token}
                </span>
              );
            }

            // Other angle brackets
            if (token.startsWith('<') && token.endsWith('>')) {
              return (
                <span
                  key={tokenIndex}
                  className="inline-flex items-center px-1 py-0.2 mx-0.5 rounded text-xs font-mono bg-purple-950/60 text-purple-300 border border-purple-500/30"
                >
                  {token}
                </span>
              );
            }

            // Summary task types: [reference generation], [video continuation], etc.
            if (/^\[(keyframe completion|reference generation|video editing|video continuation|audio reuse|audio reference)/.test(token)) {
              return (
                <span
                  key={tokenIndex}
                  className="inline-flex items-center px-2 py-0.5 mx-0.5 rounded text-xs font-mono font-bold bg-blue-950/90 text-blue-300 border border-blue-500/50"
                >
                  {token}
                </span>
              );
            }

            // [Shot N]
            if (/^\[Shot \d+\]$/i.test(token)) {
              return (
                <span
                  key={tokenIndex}
                  className="inline-flex items-center px-2 py-0.5 mx-0.5 rounded text-xs font-mono font-bold bg-cyan-950/90 text-cyan-300 border border-cyan-500/50"
                >
                  {token}
                </span>
              );
            }

            // Cut timecode: At MM:SS.mmm
            if (/^At\s+\d{2}:\d{2}\.\d{3},?$/i.test(token)) {
              return (
                <span
                  key={tokenIndex}
                  className="inline-flex items-center px-1.5 py-0.2 mx-0.5 rounded text-xs font-mono font-semibold bg-amber-950/80 text-amber-300 border border-amber-500/40"
                >
                  {token}
                </span>
              );
            }

            // Other brackets
            if (token.startsWith('[') && token.endsWith(']')) {
              return (
                <span
                  key={tokenIndex}
                  className="inline-flex items-center px-1.5 py-0.2 mx-0.5 rounded text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/30"
                >
                  {token}
                </span>
              );
            }

            // On-Screen text: Visible text inside quotes ""
            if (token.startsWith('"') && token.endsWith('"')) {
              return (
                <span
                  key={tokenIndex}
                  className="text-amber-300 font-medium bg-amber-950/30 px-1 py-0.5 rounded border border-amber-500/20"
                  title="畫面上可見文字 (On-Screen Text)"
                >
                  {token}
                </span>
              );
            }

            return <span key={tokenIndex}>{token}</span>;
          })}
        </div>
      );
    });
  };

  return (
    <div
      className={`font-mono text-xs leading-relaxed whitespace-pre-wrap selection:bg-purple-500/30 ${className}`}
    >
      {formatText(text)}
    </div>
  );
};
