// src/components/ui/visually-hidden.tsx

interface VisuallyHiddenProps {
  children: React.ReactNode
}

export function VisuallyHidden({ children }: VisuallyHiddenProps) {
  return (
    <span
      className="absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0"
      style={{
        clip: 'rect(0, 0, 0, 0)',
        clipPath: 'inset(50%)',
        margin: '-1px',
      }}
    >
      {children}
    </span>
  )
}
