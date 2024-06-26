import { FC } from 'react'

const Footer: FC = () => {
  return (
    <footer className="font-sans">
      <div className="text-sm text-bold container flex items-center justify-center h-12 px-[5px] md:justify-end">
        <div>
          <a
            href="https://zerino.org"
            target="_blank"
            rel="noreferrer"
          >
            zerino desenvolvimento
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
