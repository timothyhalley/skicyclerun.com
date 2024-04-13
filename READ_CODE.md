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