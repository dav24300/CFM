type Block =
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };

function parseMarkdown(md: string): Block[] {
  const blocks: Block[] = [];
  const lines = md.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push({ type: "h2", text: line.slice(3).trim() });
      i++;
      continue;
    }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("- ")) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }
    const para: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith("## ") &&
      !lines[i].trim().startsWith("- ")
    ) {
      para.push(lines[i].trim());
      i++;
    }
    blocks.push({ type: "p", text: para.join(" ") });
  }
  return blocks;
}

type Props = { content: string; className?: string };

export function SimpleMarkdown({ content, className = "" }: Props) {
  const blocks = parseMarkdown(content);
  return (
    <div className={`space-y-6 text-site-muted leading-relaxed ${className}`}>
      {blocks.map((block, idx) => {
        if (block.type === "h2") {
          return (
            <section key={idx}>
              <h2 className="font-serif text-xl font-bold text-site-ink">{block.text}</h2>
            </section>
          );
        }
        if (block.type === "ul") {
          return (
            <ul key={idx} className="list-disc space-y-1 pl-6">
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        }
        return <p key={idx}>{block.text}</p>;
      })}
    </div>
  );
}
