// src/types/navigation.ts
// Navigation component type definitions

export interface NavLink {
  label: string
  href: string
  external?: boolean
}

export interface NavbarProps {
  transparent?: boolean
  showCta?: boolean
}

export interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  links: NavLink[]
}

export interface LogoProps {
  showWordmark?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}
