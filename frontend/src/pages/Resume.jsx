import content from '../content/content.json'
import { Icons, PageHead, Reveal } from '../ui'

const { resumeUrl, name } = content.profile

export default function Resume() {
  return (
    <>
      <PageHead eyebrow="Resume" title="My resume" sub="The one-page version. Read it here, or grab the PDF." />
      <Reveal className="mt-8">
        <div className="mb-4 flex justify-end">
          <a href={resumeUrl} download={`${name.replace(/\s+/g, '-')}-Resume.pdf`} className="group inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-chip px-3.5 text-[13.5px] font-medium text-ink transition-colors hover:border-muted/40">
            <span className="transition-transform duration-300 ease-out group-hover:translate-y-0.5">{Icons.download}</span>
            Download PDF
          </a>
        </div>
        {/* Phones often can't render inline PDFs; the fallback inside <object> covers them. */}
        <object data={`${resumeUrl}#view=FitH&toolbar=0`} type="application/pdf" aria-label={`${name}'s resume`} className="h-[min(85vh,1100px)] w-full rounded-[12px] border border-line bg-chip">
          <div className="grid h-full place-items-center p-8 text-center">
            <p className="copy">
              Your browser can't show the PDF inline.{' '}
              <a href={resumeUrl} className="link">Open the resume</a>
            </p>
          </div>
        </object>
      </Reveal>
    </>
  )
}
