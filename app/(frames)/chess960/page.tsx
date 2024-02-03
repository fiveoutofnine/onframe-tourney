export default function Page() {
  const title = 'Chess960 | Onframe Tourney';

  return (
    <html>
      <head>
        <title>Chess960 | Onframe Tourney</title>
        <meta property="og:title" content={title} />
        <meta
          property="og:image"
          content="https://onframe-tourney.vercel.app/static/og/chess960.png"
        />
        <meta name="fc:frame" content="vNext" />
        <meta
          name="fc:frame:image"
          content="https://onframe-tourney.vercel.app/static/og/chess960.png"
        />
        <meta
          name="fc:frame:post_url"
          content={`${process.env.BASE_URL}/api/chess960/move?init=1`}
        />
        <meta name="fc:frame:button:1" content="Compete" />
      </head>
    </html>
  );
}
