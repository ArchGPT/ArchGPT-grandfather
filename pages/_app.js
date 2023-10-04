// This default export is required in a new `pages/_app.js` file.
export default function MyApp({ Component, pageProps }) {
  return <>
    <script src="https://cdn.jsdelivr.net/npm/@xiee/utils/js/key-buttons.min.js" defer></script>
    <link href="https://cdn.jsdelivr.net/npm/@xiee/utils/css/key-buttons.min.css" rel="stylesheet" />
    <Component {...pageProps} /></>
}