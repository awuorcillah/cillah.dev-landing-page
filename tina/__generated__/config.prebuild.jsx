// tina/config.ts
import { defineConfig } from "tinacms";
var branch = "main";
var config_default = defineConfig({
  branch,
  // Get this from tina.io
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
  token: process.env.TINA_TOKEN,
  build: {
    outputFolder: "admin",
    publicFolder: "public"
  },
  media: {
    tina: {
      mediaRoot: "uploads",
      publicFolder: "public"
    }
  },
  // See docs on content modeling for more info on how to setup new collections: https://tina.io/docs/schema/
  schema: {
    collections: [
      {
        name: "useCases",
        label: "Use Cases",
        path: "content/use-cases",
        format: "md",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true
          },
          {
            type: "string",
            name: "slug",
            label: "Slug",
            required: true
          },
          {
            type: "string",
            name: "teaser",
            label: "Teaser",
            required: true,
            ui: {
              component: "textarea"
            }
          },
          {
            type: "image",
            name: "featuredImage",
            label: "Featured Image"
          },
          {
            type: "rich-text",
            name: "content",
            label: "Content",
            isBody: true
          },
          {
            type: "datetime",
            name: "publishedAt",
            label: "Published At"
          },
          {
            type: "boolean",
            name: "featured",
            label: "Featured"
          }
        ]
      }
    ]
  }
});
export {
  config_default as default
};
