// Astro directive types for TypeScript
declare namespace astroHTML.JSX {
  interface HTMLAttributes {
    "set:html"?: string;
    "set:text"?: string;
    "client:load"?: boolean;
    "client:idle"?: boolean;
    "client:visible"?: boolean;
    "client:media"?: string;
    "client:only"?: string;
    "transition:name"?: string;
    "transition:animate"?: string;
    slot?: string;
  }

  interface AnchorHTMLAttributes extends HTMLAttributes {
    "transition:name"?: string;
  }

  interface IntrinsicAttributes {
    "client:load"?: boolean;
    "client:idle"?: boolean;
    "client:visible"?: boolean;
    "client:media"?: string;
    "client:only"?: string;
  }
}

// Extend React's JSX namespace for components
declare namespace React.JSX {
  interface IntrinsicAttributes {
    "client:load"?: boolean;
    "client:idle"?: boolean;
    "client:visible"?: boolean;
    "client:media"?: string;
    "client:only"?: string;
  }
}
