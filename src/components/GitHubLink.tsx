import GitHubIcon from '../assets/GitHub_Invertocat_White.svg'

export function GitHubLink() {
  return (
    <a href="//github.com/vrcalphabet/web-fs-glob" target="_blank" >
      <div className="fixed top-0 right-0 flex h-[108px] w-[108px] translate-x-1 select-none -translate-y-1 cursor-pointer justify-end bg-[#101411] p-2 transition-transform [clip-path:polygon(0_0,100%_0,100%_100%)] hover:translate-0">
        <img src={GitHubIcon} alt="GitHub Icon" className="h-1/2 w-1/2" />
      </div>
    </a>
  )
}
