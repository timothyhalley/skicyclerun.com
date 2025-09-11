import type { APIRoute } from "astro";
import { Amplify } from "aws-amplify";
import { getCurrentUser } from "aws-amplify/auth/server";
// The function is in the Next.js adapter
import { runWithAmplifyServerContext } from "@aws-amplify/adapter-nextjs/api";
// The *type* for the context is in the core adapter package
import type { AmplifyServer } from "@aws-amplify/core/internals/adapter-core";
import { promises as fs } from "fs";
import path from "path";

// We need to re-configure Amplify on the server side.
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: "us-west-2_UqZZY2Hbw",
      userPoolClientId: "hsrpdhl5sellv9n3dotako1tm",
    },
  },
};

Amplify.configure(amplifyConfig, { ssr: true });

export const GET: APIRoute = async ({ params, cookies }) => {
  const slug = params.slug;

  if (!slug) {
    return new Response("Missing slug", { status: 400 });
  }

  try {
    // 1. Run the auth check within the server context
    const { user } = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      // The operation now receives contextSpec with the correct type
      operation: (contextSpec: AmplifyServer.ContextSpec) => {
        return getCurrentUser(contextSpec);
      },
    });

    // 2. If we get here, the user is authenticated.
    console.log(`User ${user.userId} is authorized to view ${slug}.`);

    // 3. Find and read the protected .mdx file from the filesystem.
    const filePath = path.join(
      process.cwd(),
      "src",
      "content",
      "blog",
      `${slug}.mdx`
    );
    const content = await fs.readFile(filePath, "utf-8");

    // 4. Send the raw MDX content back to the client.
    return new Response(content, {
      status: 200,
      headers: { "Content-Type": "text/markdown" },
    });
  } catch (error) {
    // 5. If getCurrentUser() throws an error, the user is not authenticated.
    console.log("Unauthorized request for content:", slug);
    return new Response("Unauthorized", { status: 401 });
  }
};