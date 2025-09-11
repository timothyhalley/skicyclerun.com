# scr/pages/travels/index.astro

<!-- ---
import { getCollection } from "astro:content";
import Travels from "@layouts/Travels.astro";
import getSortedTravels from "@utils/getSortedTravels";
import getPagination from "@utils/getPagination";

const posts = await getCollection("blog");

const sortedPosts = getSortedTravels(posts);

const pagination = getPagination({
  posts: sortedPosts,
  page: 1,
  isIndex: true,
})
---

<Travels {...pagination} /> -->

# src/pages/travels/[slug]/index.astro
<!-- 
---
import { type CollectionEntry, getCollection } from "astro:content";
import Posts from "@layouts/Posts.astro";
import PostDetails from "@layouts/PostDetails.astro";
import getSortedPosts from "@utils/getSortedPosts";
import getPageNumbers from "@utils/getPageNumbers";
import getPagination from "@utils/getPagination";

export interface Props {
  post: CollectionEntry<"blog">;
}

export async function getStaticPaths() {
  const posts = await getCollection("blog", ({ data }) => !data.draft);

  const postResult = posts.map(post => ({
    params: { slug: post.slug },
    props: { post },
  }));

  const pagePaths = getPageNumbers(posts.length).map(pageNum => ({
    params: { slug: String(pageNum) },
  }));
  return [...postResult, ...pagePaths];
}

const { slug } = Astro.params;
const { post } = Astro.props;

const posts = await getCollection("blog");

const sortedPosts = getSortedPosts(posts);

const pagination = getPagination({
  posts: sortedPosts,
  page: slug,
})
---

{post ? <PostDetails post={post} /> : <Posts {...pagination} />} -->

# src/pages/travels/[slug]/index.png.ts
<!-- 
import type { APIRoute } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import { generateOgImageForPost } from "@utils/generateOgImages";
import { slugifyStr } from "@utils/slugify";

export async function getStaticPaths() {
  const posts = await getCollection("blog").then(p =>
    p.filter(({ data }) => !data.draft && !data.ogImage)
  );

  return posts.map(post => ({
    params: { slug: slugifyStr(post.data.title) },
    props: post,
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const png = await generateOgImageForPost(props as CollectionEntry<"blog">);
  return new Response(png.buffer as ArrayBuffer, {
    headers: { "Content-Type": "image/png" },
  });
}; -->

# Components > AmplifyAuthenticator.tsx
<!-- import { Amplify } from "aws-amplify";
import outputs from "@config/amplify_outputs.json";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import type { ReactNode } from "react";

Amplify.configure(outputs);

export default function AmplifyAuthenticator({
  children,
}: {
  children: ReactNode | ((context: any) => ReactNode);
}) {
  return (
    <Authenticator>
      {context => {
        // Debug: log context to browser console
        console.log("AmplifyAuthenticator context:", context);
        if (!context || !context.user) {
          return <></>;
        }
        return (
          <>{typeof children === "function" ? children(context) : children}</>
        );
      }}
    </Authenticator>
  );
} -->


# Components > AmplifyAuthIsland.tsx
<!-- // src/components/AmplifyAuthIsland.ts
import { Amplify } from "aws-amplify";
import { getCurrentUser, signInWithRedirect, signOut } from "@aws-amplify/auth";
import type { AuthUserPoolConfig } from "@aws-amplify/auth";

const amplifyConfig = {
  Auth: {
    region: "us-west-2",
    userPoolId: "us-west-2_UqZZY2Hbw",
    userPoolClientId: "hsrpdhl5sellv9n3dotako1tm",
    oauth: {
      domain: "us-west-2uqzzy2hbw.auth.us-west-2.amazoncognito.com",
      scope: ["email", "openid", "profile"],
      redirectSignIn: "<http://localhost:4321/>",
      redirectSignOut: "<http://localhost:4321/>",
      responseType: "code",
    },
  },
};

Amplify.configure(amplifyConfig as any);

export default async function mountAuthIsland(container: HTMLElement) {
  const btn = container.querySelector("button") as HTMLElement | null;
  const loginSvg = container.querySelector(".login-svg") as HTMLElement | null;
  const logoutSvg = container.querySelector(
    ".logout-svg"
  ) as HTMLElement | null;

  async function updateUI() {
    if (!btn || !loginSvg || !logoutSvg) {
      // Required elements are missing, do not proceed
      return;
    }
    try {
      const user = await getCurrentUser();
      // User is signed in
      loginSvg.style.display = "none";
      logoutSvg.style.display = "";
      btn.title = "Logout";
      btn.setAttribute("aria-label", "logout");
      btn.onclick = async () => {
        await signOut({ global: true });
        window.location.reload();
      };
    } catch {
      // User is not signed in
      loginSvg.style.display = "";
      logoutSvg.style.display = "none";
      btn.title = "Login";
      btn.setAttribute("aria-label", "login");
      btn.onclick = () => signInWithRedirect();
    }
  }

  updateUI();
} -->


# Compoents > AmplifyContectDegug.tsx
<!-- 
import { Amplify } from "aws-amplify";
import outputs from "@config/amplify_outputs.json";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);

export default function AmplifyContextDebug() {
  return (
    <Authenticator>
      {(context) => (
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
          {JSON.stringify(context, null, 2)}
        </pre>
      )}
    </Authenticator>
  );
} -->

# Components > AuthIsland.astro
<!-- 
<div id="auth-container">
  <button
    id="auth-btn"
    class="focus-outline login-logout-btn"
    title="Login/Logout"
    aria-label="login-logout"
    aria-live="polite"
    type="button"
  >
    <svg
      id="login-svg"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="icon-login"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
      <path
        d="M9 8v-2a2 2 0 0 1 2 -2h7a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-7a2 2 0 0 1 -2 -2v-2"
      ></path>
      <path d="M3 12h13l-3 -3"></path>
      <path d="M13 15l3 -3"></path>
    </svg>
    <svg
      id="logout-svg"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="icon-logout"
      style="display:none"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
      <path
        d="M10 8v-2a2 2 0 0 1 2 -2h7a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-7a2 2 0 0 1 -2 -2v-2"
      ></path>
      <path d="M15 12h-12l3 -3"></path>
      <path d="M6 15l-3 -3"></path>
    </svg>
  </button>
</div>

<style>
  /* Your button styles are perfect, keep them here */
  .login-logout-btn {
    padding: 0.75rem;
    transition: transform 0.2s;
  }
  @media (min-width: 640px) {
    .login-logout-btn {
      padding: 0.25rem;
    }
  }
  .login-logout-btn .icon-login,
  .login-logout-btn .icon-logout {
    width: 1.5rem;
    height: 1.5rem;
    color: var(--color-text-base);
    transition:
      color 0.2s,
      transform 0.2s;
    fill: none !important;
    stroke: currentColor;
  }
  .login-logout-btn:hover .icon-login,
  .login-logout-btn:hover .icon-logout {
    color: var(--color-accent);
    transform: scale(1.15) rotate(-8deg);
  }
</style>

<script>
  // This script's only job is to import and run the logic.
  import { initializeAuth } from "@scripts/auth-island-clients";

  // Run the initialization logic.
  initializeAuth();
</script> -->



# AuthGate.tsx
<!-- import { Amplify } from "aws-amplify";
import outputs from "@config/amplify_outputs.json";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import type { ReactNode } from "react";

Amplify.configure(outputs);

export default function AuthGate({ children }: { children: ReactNode }) {
  return (
    <Authenticator>
      {context => {
        // Always render debug info
        return (
          <div style={{ padding: "2rem", border: "1px solid #ccc" }}>
            <pre style={{ background: "#eee", padding: "1rem" }}>
              {JSON.stringify(context, null, 2)}
            </pre>
            {!context && <div>Loading authentication...</div>}
            {context && !context.user && (
              <div>Please sign in to view this content.</div>
            )}
            {context && context.user && <>{children}</>}
          </div>
        );
      }}
    </Authenticator>
  );
}
  -->
 
 
  * hold to expand to multi images test
  <script>
    class AstroPhoto extends HTMLElement {
      constructor() {
        super();
        let count = 1; // Already at zero on page load

        // Get image.
        const photos = this.dataset.photos;
        const albumUrls = photos.split(",");

        const image = this.querySelector("img");
        image.addEventListener("click", () => {
          // some reason undefined is not working thus < only
          if (count <= albumUrls.length - 1) {
            image.src = albumUrls[count];
            count++;
          } else {
            count = 0;
          }
        });
      }
    }

    // Tell the browser to use our AstroHeart class for <astro-heart> elements.
    customElements.define("astro-photo", AstroPhoto);
  </script>
  
  
  
  =============
  <astro-heart>
    <button aria-label="Heart">💜</button> × <span>0</span>
  </astro-heart>

  <astro-greet data-message={message}>
    <button>Say hi!</button>
  </astro-greet>
<script>
    let clickCount = 0;

    // Define the behaviour for our new type of HTML element.
    class AstroHeart extends HTMLElement {
      constructor() {
        super();
        let count = 0;

        const heartButton = this.querySelector("button");
        const countSpan = this.querySelector("span");

        // Each time the button is clicked, update the count.
        heartButton.addEventListener("click", () => {
          count++;
          countSpan.textContent = count.toString();
        });
      }
    }
    class AstroGreet extends HTMLElement {
      constructor() {
        super();

        // Read the message from the data attribute.
        const message = this.dataset.message;
        const button = this.querySelector("button");
        button.addEventListener("click", () => {
          alert(message);
        });
      }
    }


    // Tell the browser to use our AstroHeart class for <astro-heart> elements.
    customElements.define("astro-heart", AstroHeart);
    customElements.define("astro-greet", AstroGreet);

  </script>

<!-- <div class="lg:px-32 lg:pt-24 container mx-auto px-5 py-2">
  <div class="md:-m-2 -m-1 flex flex-wrap">
    <div class="flex w-full flex-wrap">
      <ul class="md:p-2 w-full p-1">
        {
          photos.map((photo: string) => (
            <li class="md:p-2 w-full p-1">
              <img
                alt="gallery"
                class="block h-full w-full rounded-lg object-cover object-center"
                src={photo}
              />
            </li>
          ))
        }
      </ul>
    </div>
  </div>
</div>


</html>
-->
    
    
    
    <div class="lg:px-32 lg:pt-24 container mx-auto px-5 py-2">
      <div class="md:-m-2 -m-1 flex flex-wrap">
        <div class="flex w-1/2 flex-wrap">
          <div class="md:p-2 w-1/2 p-1">
            <img
              alt="gallery"
              class="block h-full w-full rounded-lg object-cover object-center"
              src={photos[count]}
            />
          </div>
          <div class="md:p-2 w-1/2 p-1">
            <img
              alt="gallery"
              class="block h-full w-full rounded-lg object-cover object-center"
              src={photos[count + 1]}
            />
          </div>
          <div class="md:p-2 w-full p-1">
            <img
              alt="gallery"
              class="block h-full w-full rounded-lg object-cover object-center"
              src={photos[count + 2]}
            />
          </div>
        </div>
        <div class="flex w-1/2 flex-wrap">
          <div class="md:p-2 w-full p-1">
            <img
              alt="gallery"
              class="block h-full w-full rounded-lg object-cover object-center"
              src={photos[count + 3]}
            />
          </div>
          <div class="md:p-2 w-1/2 p-1">
            <img
              alt="gallery"
              class="block h-full w-full rounded-lg object-cover object-center"
              src={photos[count + 4]}
            />
          </div>
          <div class="md:p-2 w-1/2 p-1">
            <img
              alt="gallery"
              class="block h-full w-full rounded-lg object-cover object-center"
              src={photos[count + 5]}
            />
          </div>
        </div>
      </div>
    </div>