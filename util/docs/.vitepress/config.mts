import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Garden Labs Docs",
  description: "Documentation for Garden Labs",
  head: [["link", { rel: "icon", type: "image/png", href: "/icon.png" }]],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: "/icon.png",

    nav: [{ text: "Garden Labs", link: "https://gardenlabs.com/" }],

    sidebar: [
      {
        text: "Overview",
        items: [
          {
            text: "Introduction",
            link: "/",
          },
        ],
      },
      {
        text: "Vending Machine",
        items: [
          {
            text: "Introduction",
            link: "/pages/vending-machine/introduction",
          },
        ],
      },
      {
        text: "Holder Metadata",
        items: [
          {
            text: "Introduction",
            link: "/pages/holder-metadata/introduction",
          },
          {
            text: "Background",
            link: "/pages/holder-metadata/background",
          },
          {
            text: "Field Authority Interface",
            link: "/pages/holder-metadata/field-authority-interface",
          },
          {
            text: "Holder Metadata Program",
            link: "/pages/holder-metadata/holder-metadata-program",
          },
          {
            text: "Example: AI Aliens",
            link: "/pages/holder-metadata/example-ai-aliens",
          },
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
