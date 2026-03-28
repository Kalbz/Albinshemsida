(function () {
  const page = document.body.dataset.page;

  function getDateParts(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);
    return { year, month, day };
  }

  function formatDate(dateString) {
    const { year, month, day } = getDateParts(dateString);
    return new Intl.DateTimeFormat("sv-SE", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(new Date(year, month - 1, day));
  }

  function formatMonthValue(dateString) {
    const { year, month } = getDateParts(dateString);
    return `${year}-${String(month).padStart(2, "0")}`;
  }

  function formatMonthLabel(monthValue) {
    const [year, month] = monthValue.split("-").map(Number);
    return new Intl.DateTimeFormat("sv-SE", {
      year: "numeric",
      month: "long"
    }).format(new Date(year, month - 1, 1));
  }

  function renderBlogPage() {
    const posts = Array.isArray(window.blogPosts) ? [...window.blogPosts] : [];
    if (!posts.length) return;

    const list = document.getElementById("blog-list");
    const monthFilter = document.getElementById("blog-month-filter");
    const startInput = document.getElementById("blog-start-date");
    const endInput = document.getElementById("blog-end-date");
    const toggle = document.getElementById("blog-toggle");
    const meta = document.getElementById("blog-results-meta");
    const modal = document.getElementById("blog-modal");
    const modalBackdrop = document.getElementById("blog-modal-backdrop");
    const modalClose = document.getElementById("blog-modal-close");
    const modalCategory = document.getElementById("blog-modal-category");
    const modalDate = document.getElementById("blog-modal-date");
    const modalTitle = document.getElementById("blog-modal-title");
    const modalContent = document.getElementById("blog-modal-content");

    let expanded = false;
    let lastTrigger = null;

    posts.sort((a, b) => b.date.localeCompare(a.date));

    const monthOptions = [...new Set(posts.map((post) => formatMonthValue(post.date)))];
    monthOptions.forEach((monthValue) => {
      const option = document.createElement("option");
      option.value = monthValue;
      option.textContent = formatMonthLabel(monthValue);
      monthFilter.appendChild(option);
    });

    function getFilteredPosts() {
      const selectedMonth = monthFilter.value;
      const startDate = startInput.value || null;
      const endDate = endInput.value || null;

      return posts.filter((post) => {
        const monthMatch = selectedMonth === "all" || formatMonthValue(post.date) === selectedMonth;
        const startMatch = !startDate || post.date >= startDate;
        const endMatch = !endDate || post.date <= endDate;
        return monthMatch && startMatch && endMatch;
      });
    }

    function render() {
      const filteredPosts = getFilteredPosts();
      const visiblePosts = expanded ? filteredPosts : filteredPosts.slice(0, 3);

      list.innerHTML = "";

      if (!filteredPosts.length) {
        list.innerHTML = '<article class="blog-card"><div class="blog-card-main"><h3>Inga inlägg matchar filtret</h3><p>Testa en annan månad eller justera datumintervallet.</p></div></article>';
        toggle.hidden = true;
        meta.textContent = "0 inlägg visas.";
        return;
      }

      visiblePosts.forEach((post) => {
        const card = document.createElement("article");
        card.className = "blog-card";
        card.innerHTML = `
          <button class="blog-card-button" type="button" aria-label="Öppna inlägget ${post.title}">
            <div class="blog-card-main">
              <div class="meta-row">
                <span class="pill">${post.category || "Blogg"}</span>
                <span>${formatDate(post.date)}</span>
              </div>
              <h3>${post.title}</h3>
              <p>${post.excerpt}</p>
              <span class="blog-card-hint">Klicka för att läsa hela inlägget</span>
            </div>
          </button>
        `;
        const trigger = card.querySelector(".blog-card-button");
        trigger.addEventListener("click", () => openModal(post, trigger));
        list.appendChild(card);
      });

      const hasMoreThanThree = filteredPosts.length > 3;
      toggle.hidden = !hasMoreThanThree;
      toggle.textContent = expanded ? "Visa färre" : "Se alla";
      meta.textContent = hasMoreThanThree && !expanded
        ? `${visiblePosts.length} av ${filteredPosts.length} inlägg visas.`
        : `${filteredPosts.length} inlägg visas.`;
    }

    function createBlogBlock(block) {
      if (typeof block === "string") {
        const paragraph = document.createElement("p");
        paragraph.textContent = block;
        return paragraph;
      }

      if (!block || typeof block !== "object") {
        return null;
      }

      switch (block.type) {
        case "paragraph": {
          const paragraph = document.createElement("p");
          paragraph.textContent = block.text || "";
          return paragraph;
        }
        case "heading": {
          const heading = document.createElement("h4");
          heading.className = "blog-block-heading";
          heading.textContent = block.text || "";
          return heading;
        }
        case "quote": {
          const quote = document.createElement("blockquote");
          quote.className = "blog-block-quote";
          quote.textContent = block.text || "";
          return quote;
        }
        case "image": {
          const figure = document.createElement("figure");
          figure.className = "blog-media-card";

          const image = document.createElement("img");
          image.src = block.src || "";
          image.alt = block.alt || "";
          image.loading = "lazy";
          figure.appendChild(image);

          if (block.caption) {
            const caption = document.createElement("figcaption");
            caption.textContent = block.caption;
            figure.appendChild(caption);
          }

          return figure;
        }
        case "video": {
          const figure = document.createElement("figure");
          figure.className = "blog-media-card";

          if (block.embed) {
            const frameWrap = document.createElement("div");
            frameWrap.className = "blog-video-embed";

            const frame = document.createElement("iframe");
            frame.src = block.embed;
            frame.title = block.title || "Video";
            frame.loading = "lazy";
            frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
            frame.allowFullscreen = true;
            frameWrap.appendChild(frame);
            figure.appendChild(frameWrap);
          } else if (block.src) {
            const video = document.createElement("video");
            video.src = block.src;
            video.controls = true;
            video.preload = "metadata";
            if (block.poster) {
              video.poster = block.poster;
            }
            figure.appendChild(video);
          }

          if (block.caption) {
            const caption = document.createElement("figcaption");
            caption.textContent = block.caption;
            figure.appendChild(caption);
          }

          return figure;
        }
        case "link": {
          const link = document.createElement("a");
          link.className = "blog-link-card";
          link.href = block.href || "#";
          link.target = "_blank";
          link.rel = "noreferrer";
          link.innerHTML = `
            <span class="blog-link-label">${block.label || "Extern länk"}</span>
            <strong>${block.title || block.href || ""}</strong>
            ${block.description ? `<span>${block.description}</span>` : ""}
          `;
          return link;
        }
        default: {
          const fallback = document.createElement("p");
          fallback.textContent = block.text || "";
          return fallback;
        }
      }
    }

    function openModal(post, trigger) {
      if (!modal) return;

      lastTrigger = trigger;
      modalCategory.textContent = post.category || "Blogg";
      modalDate.textContent = formatDate(post.date);
      modalTitle.textContent = post.title;
      modalContent.innerHTML = "";

      const contentBlocks = Array.isArray(post.content) ? post.content : [post.excerpt];
      contentBlocks.forEach((paragraph) => {
        const node = createBlogBlock(paragraph);
        if (node) {
          modalContent.appendChild(node);
        }
      });

      modal.hidden = false;
      document.body.classList.add("modal-open");
      modalClose.focus();
    }

    function closeModal() {
      if (!modal || modal.hidden) return;

      modal.hidden = true;
      document.body.classList.remove("modal-open");
      if (lastTrigger) {
        lastTrigger.focus();
      }
    }

    [monthFilter, startInput, endInput].forEach((element) => {
      element.addEventListener("input", () => {
        expanded = false;
        render();
      });
      element.addEventListener("change", () => {
        expanded = false;
        render();
      });
    });

    toggle.addEventListener("click", () => {
      expanded = !expanded;
      render();
    });

    if (modalClose) {
      modalClose.addEventListener("click", closeModal);
    }

    if (modalBackdrop) {
      modalBackdrop.addEventListener("click", closeModal);
    }

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeModal();
      }
    });

    render();
  }

  function renderResources(items) {
    const list = document.getElementById("resource-list");
    if (!list) return;

    items.forEach((item) => {
      const article = document.createElement("article");
      article.className = item.secondaryImage ? "resource-card resource-card-dual" : "resource-card";
      article.innerHTML = `
        <a class="resource-image" href="${item.url}" target="_blank" rel="noreferrer">
          <img src="${item.image}" alt="${item.imageAlt}">
        </a>
        <div class="resource-content">
          <span class="pill">${item.tag}</span>
          <h2>${item.title}</h2>
          <p>${item.description}</p>
          <div>
            <a class="button" href="${item.url}" target="_blank" rel="noreferrer">${item.cta}</a>
          </div>
        </div>
        ${item.secondaryImage ? `<a class="resource-image resource-image-secondary" href="${item.url}" target="_blank" rel="noreferrer"><img src="${item.secondaryImage}" alt="${item.secondaryImageAlt || item.imageAlt}"></a>` : ""}
      `;
      list.appendChild(article);
    });
  }

  const savingsItems = [
    {
      title: "Cashback is king",
      description: "Ditt absoluta favorit verktyg för pengar tillbaka på varje köp",
      url: "https://www.refunder.se/b/Engblom",
      cta: "Se hit",
      tag: "Cashback",
      image: "assets/images/Refunder_icon.png",
      imageAlt: "Anteckningar och kalkylblad för budgetplanering"
    },
    {
      title: "Guide till smartare vardagsbeslut",
      description: "",
      url: "",
      cta: "Se hit",
      tag: "Deal",
      image: "assets/images/Stabelo_icon.png",
      imageAlt: "Person som granskar sina kostnader vid ett skrivbord"
    },
    {
      title: "Se över ditt elavtal",
      description: "Uttnyttja elavtalserbjudanden. Hos Refunder kan man t.ex få 1000 kr cashback som ny kund på de flesta elbolag.",
      url: "https://www.refunder.se/b/Engblom",
      cta: "Se hit",
      tag: "Deal",
      image: "assets/images/El_icon.webp",
      imageAlt: "Kort och kvitton som symboliserar smartare köp"
    }
  ];

  const incomeItems = [
    {
      title: "Tjäna pengar på enkäter",
      description: "Perfekta extraknäcket på arbetsrasterna, utbetalt direkt på Swish, anmäl dig till undersökningar för att tjäna större summor",
      url: "https://again.app/se/get/albin_benjamin_e",
      cta: "Se hit",
      tag: "Enkäter",
      image: "assets/images/Again_icon.png",
      imageAlt: "Laptop och arbetsyta för digitalt sidoprojekt",
      secondaryImage: "assets/images/Again_clickbait.jpeg",
      secondaryImageAlt: "Again Clickbait ikon"
    },
    {
      title: "Få gratis aktier och krypto vid din första insättning",
      description: "Följ länken för €10 gratis i Krypto",
      url: "https://join.robinhood.com/eu_crypto/albine-7825591/",
      cta: "Se hit",
      tag: "Krypto",
      image: "assets/images/Robinhood_icon.png",
      imageAlt: "Kamera och utrustning för skapande av digitalt innehåll"
    },
    {
      title: "Tjäna upp mot 400 kr i Krypto",
      description: "Skapa ett nytt konto hos Coinbase för att ta del av detta grymma erbjudande",
      url: "https://coinbase.com/join/VKXBBYJ?src=ios-link",
      cta: "Se hit",
      tag: "Krypto",
      image: "assets/images/Coinbase_logo.png",
      imageAlt: "Team som planerar digitalt arbete tillsammans"
    },
    {
      title: "Hämta 101 kr på tre minuter",
      description: "Som ny kund får du 101 kr gratis genom Northmill som går att ta ut direkt genom Swish",
      url: "https://www.northmill.com/se/kort/referral?referralCode=NORTH0QLA8",
      cta: "Se hit",
      tag: "Bank",
      image: "assets/images/Northmill_logo.jpeg",
      imageAlt: "Kamera och utrustning för skapande av digitalt innehåll"
    },
    {
      title: "Öppna konto och få gratis pengar till pensionen",
      description: "Få 100 kr som ny kund hos NOWO just nu samt få 50 kr exta vid använding av länken",
      url: "https://itunes.apple.com/se/app/nowo/id1048953177",
      cta: "Se hit",
      tag: "Bank",
      image: "assets/images/NOWO_icon.png",
      imageAlt: "Kamera och utrustning för skapande av digitalt innehåll"
    },
    {
      title: "Tjäna 500/250 kr som ny kund via Refunder",
      description: "Studenter får 500 kr, övriga får 250 kr. OBS använd refunder länken för 50 kr extra",
      url: "https://itunes.apple.com/se/app/nowo/id1048953177",
      cta: "Se hit",
      tag: "Bank",
      image: "assets/images/Levler_icon.png",
      imageAlt: "Kamera och utrustning för skapande av digitalt innehåll"
    }

  ];

  if (page === "home") {
    renderBlogPage();
  }

  if (page === "savings") {
    renderResources(savingsItems);
  }

  if (page === "income") {
    renderResources(incomeItems);
  }
})();


