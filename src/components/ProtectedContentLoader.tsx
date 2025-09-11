import { useEffect } from "react";
import { marked } from "marked";

export default function ProtectedContentLoader() {
  useEffect(() => {
    console.log("ProtectedContentLoader mounted.");

    const container = document.getElementById("protected-content-container");
    if (!container) {
      console.error("Could not find #protected-content-container");
      return;
    }

    const slug = window.location.pathname.split("/").pop();
    console.log("Attempting to fetch content for slug:", slug);

    fetch(`/api/content/${slug}`)
      .then(async response => {
        console.log("API response status:", response.status);

        if (response.status === 401) {
          container.innerHTML =
            "<p>You are not authorized to view this content. Please log in.</p>";
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch content: ${response.statusText}`);
        }

        const mdxContent = await response.text();
        console.log("Successfully fetched content.");
        container.innerHTML = marked.parse(mdxContent);
      })
      .catch(error => {
        console.error("Error fetching protected content:", error);
        container.innerHTML =
          "<p>Sorry, there was an error loading the content.</p>";
      });
  }, []);

  return null;
}
