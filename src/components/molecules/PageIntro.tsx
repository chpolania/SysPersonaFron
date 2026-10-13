type PageIntroProps = {
  title: string
  emphasizedTitle: string
  description: string
}

export function PageIntro({
  title,
  emphasizedTitle,
  description,
}: PageIntroProps) {
  return (
    <>
      <div className="eyebrow"><span /> TALENTO &amp; DESARROLLO</div>
      <section className="intro">
        <h1>{title}<br /><span>{emphasizedTitle}</span></h1>
        <p>{description}</p>
      </section>
    </>
  )
}
