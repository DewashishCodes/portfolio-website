// src/pages/_app.tsx
import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head'; // Import Head for global meta

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Your OS Portfolio</title>
        <meta name="description" content="A unique OS-inspired portfolio showcasing my work." />
        <link rel="icon" href="/favicon.ico" /> {/* You can change this later */}
      </Head>
      <Component {...pageProps} />
    </>
  );
}