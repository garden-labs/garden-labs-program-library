import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Holder Metadata",
  description: "Documentation for Holder Metadata on Solana",
  head: [["link", { rel: "icon", type: "image/png", href: "/icon.png" }]],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: "/logo.svg",

    nav: [{ text: "Garden Labs", link: "https://gardenlabs.com/" }],

    sidebar: [
      {
        text: "Overview",
        items: [
          {
            text: "Introduction",
            link: "/",
          },
          {
            text: "Background",
            link: "/pages/token-2022",
          },
          {
            text: "Field Authority Interface",
            link: "/pages/field-authority-interface",
          },
          {
            text: "Holder Metadata Program",
            link: "/pages/holder-metadata",
          },
          { text: "Example: AI Aliens", link: "/pages/ai-aliens" },
        ],
      },
      {
        text: "Links",
        items: [
          { text: "Token2022", link: "https://spl.solana.com/token-2022" },
          {
            text: "sRFC 17",
            link: "https://forum.solana.com/t/srfc-00017-token-metadata-interface/283",
          },
          { text: "AI Aliens", link: "https://ai-aliens.xyz/" },
        ],
      },
    ],

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/garden-labs/holder-metadata",
      },
    ],

    search: {
      provider: "local",
    },
  },
});
