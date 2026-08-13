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

  // Split text into tokens using regex for <Subject/Picture/Video/Audio> angle brackets, @reference tags, [Shot/time] brackets, and dialogue quotes
  const formatText = (content: string) => {
    const lines = content.split('\n');

    return lines.map((line, lineIndex) => {
      // Check if the line is an official field header (e.g. integrated_multimodal_description:)
      const isHeaderLine = /^(integrated_multimodal_description|overall_soundscape|non_diegetic_music|subject_definitions|summary|retention_analysis|detailed_description):/i.test(
        line.trim()
      );

      if (isHeaderLine) {
        const colonIdx = line.indexOf(':');
        const headerName = line.slice(0, colonIdx + 1);
        const restOfLine = line.slice(colonIdx + 1);

        return (
          <div key={lineIndex} className="min-h-[1.5rem] leading-relaxed my-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/50 shadow-sm">
              {headerName}
            </span>
            <span className="text-slate-200">{restOfLine}</span>
          </div>
        );
      }

      // Process line tokens for tags, brackets, and quotes
      const tokens = line.split(/(<[^>]+>|@\w+\d*|\[[^\]]+\]|"([^"\\]|\\.)*")/g);

      return (
        <div key={lineIndex} className="min-h-[1.5rem] leading-relaxed">
          {tokens.map((token, tokenIndex) => {
            if (!token) return null;

            // Highlight angle-bracket tags (<Subject 1>, <Picture 1>, <Video 1>, <Audio 1>)
            if (token.startsWith('<') && token.endsWith('>')) {
              return (
                <span
                  key={tokenIndex}
                  className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-xs font-mono font-bold bg-purple-950/90 text-purple-300 border border-purple-500/50"
                >
                  {token}
                </span>
              );
            }

            // Highlight reference tags (@image1, @video1, @audio1)
            if (token.startsWith('@')) {
              return (
                <span
                  key={tokenIndex}
                  className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-xs font-mono font-semibold bg-purple-950/80 text-purple-300 border border-purple-500/40"
                >
                  {token}
                </span>
              );
            }

            // Highlight brackets: [Shot 1], timestamps [0s-3s], or camera [Push in]
            if (token.startsWith('[') && token.endsWith(']')) {
              const isShot = /^\[Shot \d+\]$/i.test(token);
              const isTimestamp = /^\[\d+s(-\d+s)?\]$/i.test(token);
              if (isShot) {
                return (
                  <span
                    key={tokenIndex}
                    className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-xs font-mono font-bold bg-cyan-950/90 text-cyan-300 border border-cyan-500/50"
                  >
                    {token}
                  </span>
                );
              }
              if (isTimestamp) {
                return (
                  <span
                    key={tokenIndex}
                    className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-xs font-mono font-semibold bg-amber-950/80 text-amber-300 border border-amber-500/40"
                  >
                    {token}
                  </span>
                );
              }
              // Camera move or general bracket
              return (
                <span
                  key={tokenIndex}
                  className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-xs font-mono font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40"
                >
                  {token}
                </span>
              );
            }

            // Highlight dialogue / quoted text
            if (token.startsWith('"') && token.endsWith('"')) {
              return (
                <span key={tokenIndex} className="text-emerald-300 font-medium italic">
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
      className={`font-mono text-sm leading-relaxed whitespace-pre-wrap selection:bg-purple-500/30 ${className}`}
    >
      {formatText(text)}
    </div>
  );
};
