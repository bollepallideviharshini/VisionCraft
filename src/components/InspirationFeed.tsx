import { motion } from "framer-motion";

const INSPIRATIONS = [
  { label: "90s Mall Portrait", prompt: "A nostalgic 90s mall portrait with soft pastel lighting and retro fashion" },
  { label: "Cyberpunk City", prompt: "A futuristic cyberpunk cityscape at night with neon lights and rain" },
  { label: "Wes Anderson Palette", prompt: "A symmetrical scene in Wes Anderson style with pastel colors and quirky details" },
  { label: "Macro Nature", prompt: "An extreme macro photograph of a dewdrop on a flower petal at golden hour" },
  { label: "Gothic Cathedral", prompt: "A dark gothic cathedral interior with stained glass windows and dramatic lighting" },
  { label: "Minimalist Abstract", prompt: "A clean minimalist abstract composition with geometric shapes and muted tones" },
  { label: "Surreal Dreamscape", prompt: "A surreal dreamscape with floating islands and impossible architecture" },
  { label: "Film Noir", prompt: "A moody film noir scene with dramatic shadows and a mysterious figure" },
];

interface InspirationFeedProps {
  onSelect: (prompt: string) => void;
}

export default function InspirationFeed({ onSelect }: InspirationFeedProps) {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <h3 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
        ✨ Inspiration
      </h3>
      <div className="flex flex-wrap gap-2">
        {INSPIRATIONS.map((item, i) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            onClick={() => onSelect(item.prompt)}
            className="group rounded-xl border border-border/50 bg-card/40 px-4 py-2 text-sm text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-foreground backdrop-blur-sm"
          >
            {item.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
