import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Developer Hub",
  description: "Documentation for Garden Labs programs",
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
        text: "Holder Metadata",
        items: [
          {
            text: "Introduction",
            link: "/pages/holder-metadata/introduction",
          },
          {
            text: "Token Metadata Interface",
            link: "/pages/holder-metadata/token-metadata-interface",
          },
          {
            text: "Field Authority Interface",
            link: "/pages/holder-metadata/field-authority-interface",
          },
          {
            text: "Holder Metadata Plugin",
            link: "/pages/holder-metadata/holder-metadata-plugin",
          },
          {
            text: "Example: AI Aliens",
            link: "/pages/holder-metadata/example-ai-aliens",
          },
        ],
      },
      {
        text: "Toolkit",
        items: [
          {
            text: "Introduction",
            link: "/pages/toolkit/introduction",
          },
        ],
      },
      {
        text: "Links",
        items: [
          {
            text: "Garden Labs",
            link: "https://gardenlabs.com",
          },
          {
            text: "Token Extensions",
            link: "https://solana.com/solutions/token-extensions",
          },
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
        link: "https://github.com/garden-labs",
      },
    ],

    search: {
      provider: "local",
    },
  },
});
