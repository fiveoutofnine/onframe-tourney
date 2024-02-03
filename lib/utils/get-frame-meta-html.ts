/**
 * @author https://github.com/seangeng/based-adventure/blob/3c342dc5613e9cd2bfbf893536cb9f8805f7f70f/src/lib/frameUtils.tsx
 */
const getFrameMetaHTML = ({
  title,
  imageUrl,
  postUrl,
  buttons,
}: {
  title: string;
  imageUrl: string;
  postUrl: string;
  buttons: { label: string; type?: 'post' | 'post_redirect' }[];
}) => {
  const buttonsMetadata = buttons
    .map(
      (button, i) =>
        `<meta name="fc:frame:button:${i + 1}" content="${button.label}"><meta name="fc:frame:button:${i + 1}:action" content="${button.type ?? 'post'}">`,
    )
    .join('');

  return `<!DOCTYPE html>
    <html>
      <head>
          <title>${title}</title>
          <meta property="og:title" content="${title}">
          <meta property="og:image" content="${imageUrl}">
          <meta name="fc:frame" content="vNext">
          <meta name="fc:frame:image" content="${imageUrl}">
          <meta name="fc:frame:post_url" content="${postUrl}">
          <meta name="fc:frame:input:text" content="e.g. E2 to E4">
          ${buttonsMetadata}
      </head>
    </html>`;
};

export default getFrameMetaHTML;
