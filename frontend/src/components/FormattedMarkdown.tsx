import React from 'react';

interface FormattedMarkdownProps {
  content: string;
}

export const FormattedMarkdown: React.FC<FormattedMarkdownProps> = ({ content }) => {
  if (!content) return null;

  // Clean raw asterisks and prompt artifact dumps
  const cleanContent = content
    .replace(/^Jobs:\s*\[[\s\S]*\]$/gm, '')
    .trim();

  const lines = cleanContent.split('\n');

  const parseInlineBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const innerText = part.slice(2, -2);
        return <strong key={index} className="font-extrabold text-[#1C2333]">{innerText}</strong>;
      }
      return part;
    });
  };

  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if line is part of a markdown table (contains pipes)
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.includes('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      // Filter out separator lines like |:---|:---| or |---|
      const dataRows = tableLines.filter(row => !/^\|[\s:\-]+\|/.test(row.replace(/\s+/g, '')));

      if (dataRows.length > 0) {
        const headerRow = dataRows[0];
        const bodyRows = dataRows.slice(1);

        const parseRowCells = (rowStr: string) => {
          return rowStr
            .split('|')
            .slice(1, -1)
            .map(cell => cell.trim());
        };

        const headers = parseRowCells(headerRow);

        elements.push(
          <div key={`table-${i}`} className="my-4 overflow-x-auto rounded-2xl border border-[#D6E4FF] shadow-sm bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F4F7FC] text-[#1C2333] font-extrabold uppercase text-[10.5px] border-b border-[#D6E4FF]">
                <tr>
                  {headers.map((h, idx) => (
                    <th key={idx} className="p-3 border-r border-[#D6E4FF]/60 last:border-r-0">
                      {parseInlineBold(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D6E4FF]/60">
                {bodyRows.map((row, rIdx) => {
                  const cells = parseRowCells(row);
                  return (
                    <tr key={rIdx} className="hover:bg-[#EEF4FF]/50 transition-colors">
                      {cells.map((cell, cIdx) => {
                        const isEdgeCol = cIdx === cells.length - 1;
                        const isAdvantageCell = isEdgeCol && (cell.includes('Candidate') || cell.includes('A') || cell.includes('B') || cell.includes('Tie'));
                        return (
                          <td key={cIdx} className="p-3 border-r border-[#D6E4FF]/60 last:border-r-0 text-stone-800 font-medium">
                            {isAdvantageCell ? (
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold shadow-sm ${
                                cell.toLowerCase().includes('candidate a') 
                                  ? 'bg-[#F06529]/10 text-[#F06529] border border-[#F06529]/30' 
                                  : cell.toLowerCase().includes('candidate b')
                                  ? 'bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/30'
                                  : 'bg-stone-100 text-stone-600'
                              }`}>
                                {cell}
                              </span>
                            ) : (
                              parseInlineBold(cell)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    if (!trimmed) {
      elements.push(<div key={`blank-${i}`} className="h-1" />);
      i++;
      continue;
    }

    // Header ### or ## or #
    if (trimmed.startsWith('#')) {
      const headerText = trimmed.replace(/^#+\s*/, '');
      elements.push(
        <h4 key={`h-${i}`} className="text-sm font-extrabold text-[#1C2333] mt-4 mb-1 border-b border-[#D6E4FF]/60 pb-1">
          {parseInlineBold(headerText)}
        </h4>
      );
      i++;
      continue;
    }

    // Bullet point (* or - or numbered list 1.)
    if (/^[\*\-\•]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      const bulletText = trimmed.replace(/^([\*\-\•]|\d+\.)\s+/, '');
      elements.push(
        <div key={`bullet-${i}`} className="flex items-start gap-2 ml-2 my-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F06529] mt-1.5 flex-shrink-0" />
          <div className="flex-1 text-[#1C2333]">{parseInlineBold(bulletText)}</div>
        </div>
      );
      i++;
      continue;
    }

    // Standard paragraph
    elements.push(
      <p key={`p-${i}`} className="my-1 font-medium text-stone-800">
        {parseInlineBold(trimmed)}
      </p>
    );
    i++;
  }

  return <div className="space-y-2 text-xs leading-relaxed text-[#1C2333]">{elements}</div>;
};
