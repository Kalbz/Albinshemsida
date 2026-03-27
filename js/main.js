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

    let expanded = false;

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
          <div class="blog-card-main">
            <div class="meta-row">
              <span class="pill">${post.category || "Blogg"}</span>
              <span>${formatDate(post.date)}</span>
            </div>
            <h3>${post.title}</h3>
            <p>${post.excerpt}</p>
          </div>
          <div class="blog-card-action">
            <a class="button-secondary" href="${post.link}">Läs mer</a>
          </div>
        `;
        list.appendChild(card);
      });

      const hasMoreThanThree = filteredPosts.length > 3;
      toggle.hidden = !hasMoreThanThree;
      toggle.textContent = expanded ? "Visa färre" : "Se alla";
      meta.textContent = hasMoreThanThree && !expanded
        ? `${visiblePosts.length} av ${filteredPosts.length} inlägg visas.`
        : `${filteredPosts.length} inlägg visas.`;
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

    render();
  }

  function renderResources(items) {
    const list = document.getElementById("resource-list");
    if (!list) return;

    items.forEach((item) => {
      const article = document.createElement("article");
      article.className = "resource-card";
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
      `;
      list.appendChild(article);
    });
  }

  const savingsItems = [
    {
      title: "Budgetverktyg för bättre månadskoll",
      description: "Ett exempel på resurs för att strukturera utgifter, sätta mål och få syn på vad som faktiskt går att minska.",
      url: "https://www.google.com",
      cta: "Besök",
      tag: "Verktyg",
      image: "assets/images/savings-budget.svg",
      imageAlt: "Anteckningar och kalkylblad för budgetplanering"
    },
    {
      title: "Guide till smartare vardagsbeslut",
      description: "Placeholder-innehåll för tips om abonnemang, matkostnader och rutiner som kan spara pengar utan onödig komplexitet.",
      url: "https://www.google.com",
      cta: "Läs mer",
      tag: "Guide",
      image: "assets/images/savings-guide.svg",
      imageAlt: "Person som granskar sina kostnader vid ett skrivbord"
    },
    {
      title: "Rabatter, deals och tjänster att jämföra",
      description: "En enkel plats för framtida affiliate-länkar till tjänster, prisjämförelser och verktyg som kan ge lägre månadskostnader.",
      url: "https://www.google.com",
      cta: "Se resurs",
      tag: "Deal",
      image: "assets/images/savings-deals.svg",
      imageAlt: "Kort och kvitton som symboliserar smartare köp"
    }
  ];

  const incomeItems = [
    {
      title: "Videos om sidoprojekt som går att starta direkt",
      description: "Placeholder för innehåll om små uppdrag, digitala tjänster och idéer som kan testas utan stor startkostnad.",
      url: "https://www.youtube.com",
      cta: "Öppna video",
      tag: "Video",
      image: "assets/images/income-sidehustle.svg",
      imageAlt: "Laptop och arbetsyta för digitalt sidoprojekt"
    },
    {
      title: "Frilansresurser för nybörjare",
      description: "Ett enkelt block för framtida länkar till guider, plattformar och resurser för att sälja kompetens online.",
      url: "https://www.youtube.com",
      cta: "Läs mer",
      tag: "Frilans",
      image: "assets/images/income-freelance.svg",
      imageAlt: "Team som planerar digitalt arbete tillsammans"
    },
    {
      title: "Idéer inom creator economy",
      description: "Placeholder för resurser om innehåll, annonser, affiliate och produkter som kan byggas upp över tid.",
      url: "https://www.youtube.com",
      cta: "Se guide",
      tag: "Creator",
      image: "assets/images/income-creator.svg",
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
