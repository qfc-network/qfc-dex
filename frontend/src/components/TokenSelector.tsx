import { Token, TOKENS } from "@/lib/contracts";
import { useState } from "react";

interface Props {
  selected: Token;
  onSelect: (token: Token) => void;
  exclude?: string;
}

export default function TokenSelector({ selected, onSelect, exclude }: Props) {
  const [open, setOpen] = useState(false);

  const available = TOKENS.filter((t) => t.address !== exclude);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-qfc-dark border border-qfc-border px-3 py-2 rounded-xl text-white font-semibold hover:border-qfc-primary transition"
      >
        {selected.symbol}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 bg-qfc-card border border-qfc-border rounded-xl shadow-lg z-50 min-w-[160px]">
          {available.map((token) => (
            <button
              key={token.address}
              onClick={() => { onSelect(token); setOpen(false); }}
              className={`block w-full text-left px-4 py-3 hover:bg-qfc-dark transition text-white first:rounded-t-xl last:rounded-b-xl ${
                token.address === selected.address ? "bg-qfc-primary/20" : ""
              }`}
            >
              <span className="font-semibold">{token.symbol}</span>
              <span className="text-gray-400 text-xs ml-2">{token.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
