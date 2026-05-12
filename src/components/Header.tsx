'use client'

import Image from 'next/image'
import { Activity } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-ink-900 text-white border-b border-ink-700 shadow-[0_1px_0_rgba(255,255,255,.04)_inset] overflow-hidden">
      {/* Purple glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_600px_100px_at_50%_0%,rgba(147,51,234,.12),transparent_70%)]" />

      <div className="relative z-10 flex items-center gap-6 px-8 py-[14px]">
        {/* Logo */}
        <Image
          src="/rehubs-logo.png"
          alt="Rehubs"
          width={100}
          height={24}
          className="h-6 w-auto"
          priority
        />

        {/* Title */}
        <div className="pl-[18px] border-l border-ink-700">
          <span className="font-serif text-[15px] font-normal tracking-[-0.2px] text-white">
            Clinical <em className="gradient-text not-italic">Insights</em>
          </span>
        </div>

        {/* Right meta */}
        <div className="ml-auto flex items-center gap-5 font-mono text-[10.5px] uppercase tracking-[1.2px] text-ink-400">
          {/* Live indicator */}
          <span className="flex items-center gap-1.5 text-white">
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#5DD89A]"
              style={{ animation: 'pulse-ring 2s infinite' }}
            />
            Live
          </span>

          <span className="hidden sm:block">Outcomes Platform</span>

          {/* User avatar */}
          <div className="flex items-center gap-2.5">
            <div className="w-[30px] h-[30px] rounded-full bg-brand-gradient flex items-center justify-center text-white font-sans font-semibold text-[11px]">
              RC
            </div>
            <div className="hidden md:block">
              <p className="font-sans text-[12.5px] text-white font-medium leading-tight normal-case tracking-normal">Rehubs Clinic</p>
              <p className="font-sans text-[10px] text-ink-400 leading-tight normal-case tracking-normal">Clinical Lead</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(93,216,154,.6); }
          70%  { box-shadow: 0 0 0 8px rgba(93,216,154,0); }
          100% { box-shadow: 0 0 0 0 rgba(93,216,154,0); }
        }
      `}</style>
    </header>
  )
}
