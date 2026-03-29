const { HTMLElementExt } = await import(
    window._resolveImport?.("html-element-ext") || "html-element-ext"
);

class SliderComponent extends HTMLElementExt {
    #play;

    constructor() {
        super();
        this.slider = this.querySelector("ul");
        if (!this.slider) return;

        this.pageCount = this.querySelector(".slider-counter--current");
        this.pageTotal = this.querySelector(".slider-counter--total");
        this.prevButton = this.querySelector('button[name="previous"]');
        this.nextButton = this.querySelector('button[name="next"]');
        this.pagination = this.querySelector(".slider-pagination");
        this.lastPaginationUpdate = 0;

        this.resizeObserver = new ResizeObserver((entries) => {
            this.initPages();
            this.stop();
            this.play();
        });

        this.handles = {
            "scroll::ul": this.update.bind(this),
            'click::[name="previous"],[name="next"]':
                this.onButtonClick.bind(this),
        };

        // theme editor integration
        if (Shopify?.designMode) {
            this.handles["shopify:block:select::::body"] = (event) => {
                if (this.slider.contains(event.target)) {
                    this.stop();
                    window.requestAnimationFrame(() => {
                        this.sliderScrollTo({ left: event.target.offsetLeft });
                    });
                }
            };
            this.handles["shopify:block:deselect::::body"] = (event) => {
                if (this.slider.contains(event.target)) {
                    this.stop();
                    this.play();
                }
            };
        }
    }

    collectSlides() {
        const slides = this.querySelectorAll(this.dataset?.sliderItem || "li");

        this.sliderItems = Array.from(slides).filter(
            (item) => item.offsetParent
        );
        this.originalItems = Array.from(
            this.querySelectorAll(this.dataset?.sliderItem || "li")
        );
        this.originalItems.forEach((slide) => this.showLoader(slide));
        if (
            this.dataset?.loop === "true" &&
            this.originalItems.length > 1 &&
            this.dataset?.slidesPerView === "1"
        )
            this.cloneItems();
        // smooth infinity brands slider
        if (
            this.dataset.multipleItems === "true" &&
            this.originalItems.length > 1
        )
            this.cloneMultipleItemsForInfinityScroll();
    }

    connectedCallback() {
        const { effectModuleSrc, dragAndDropModuleSrc } = this.dataset;

        if (!this.slider) return;

        this.collectSlides();
        this.setDelayProperty(this.dataset.autoplay);

        this.resizeObserver.observe(this.slider);
        super.connectedCallback();
        effectModuleSrc &&
            import(effectModuleSrc).then((module) => {
                module.addSwipeListener(
                    this.slider,
                    () =>
                        this.currentPage < this.totalPages && this.goTo("next"),
                    () => this.currentPage > 1 && this.goTo("prev")
                );
                window._sliderFadeEffectScrollTo = module.scrollTo;
            });

        dragAndDropModuleSrc &&
            import(dragAndDropModuleSrc).then((module) => {
                new module.DragAndDrop(this.slider);
            });
    }

    cloneItems() {
        // remove existing cloned items
        this.slider
            .querySelectorAll("[data-item-cloned]")
            .forEach((clonedItem) => {
                clonedItem.remove();
            });
        const numClones = Math.min(this.originalItems.length, 2);
        const firstClones = this.originalItems[0].cloneNode(true);
        const lastClones =
            this.originalItems[this.originalItems.length - 1].cloneNode(true);
        firstClones.setAttribute("data-item-cloned", true);
        lastClones.setAttribute("data-item-cloned", true);

        this.slider.appendChild(firstClones);
        this.slider.insertBefore(lastClones, this.slider.firstChild);

        // adjust scroll position to maintain the correct order
        this.slider.scrollLeft = lastClones.offsetWidth;

        // update sliderItems with cloned items
        this.sliderItems = this.querySelectorAll(
            this.dataset?.sliderItem || "li"
        );
    }

    cloneMultipleItemsForInfinityScroll() {
        this.slider
            .querySelectorAll("[data-multipleitem-cloned]")
            .forEach((clonedItem) => {
                clonedItem.remove();
            });

        const numClones = Math.min(
            this.originalItems.length,
            parseFloat(this.dataset?.slidesPerView)
        );
        const firstItemsCloned = this.originalItems
            .slice(0, numClones)
            .map((item) => {
                const cloned = item.cloneNode(true);
                cloned.setAttribute("data-multipleitem-cloned", true);
                return cloned;
            });

        const lastItemsCloned = this.originalItems
            .slice(-numClones)
            .map((item) => {
                const cloned = item.cloneNode(true);
                cloned.setAttribute("data-multipleitem-cloned", true);
                return cloned;
            });

        firstItemsCloned.forEach((clone) => this.slider.appendChild(clone));
        lastItemsCloned
            .reverse()
            .forEach((clone) =>
                this.slider.insertBefore(clone, this.slider.firstChild)
            );

        // update sliderItems with cloned items
        this.sliderItems = this.querySelectorAll(
            this.dataset?.sliderItem || "li"
        );
    }

    initPages() {
        if (this.sliderItems.length < 1) return;

        if (this.dataset.loop == "true") {
            this.totalPages = this.sliderItems.length;
        } else {
            this.slidesPerPage = Math.round(
                this.slider.clientWidth / this.sliderItems[0].clientWidth
            );
            this.totalPages =
                this.slidesPerPage > this.sliderItems.length
                    ? 1
                    : this.sliderItems.length - this.slidesPerPage + 1;
        }

        this.update();
    }

    updateInfinitySlider() {
        const scrollPosition = this.slider.scrollLeft;
        const itemWidth = this.sliderItems[0]?.clientWidth;

        if (scrollPosition <= 0) {
            this.slider.classList.add("scroll--behavior"); // disable smooth scroll temporarily
            this.slider.scrollLeft =
                this.slider.scrollWidth - 2 * this.slider.offsetWidth;
            this.slider.classList.remove("scroll--behavior");
        } else if (
            Math.ceil(scrollPosition) >=
            this.slider.scrollWidth - this.slider.clientWidth
        ) {
            this.slider.classList.add("scroll--behavior"); // disable smooth scroll temporarily
            this.slider.scrollLeft = this.slider.offsetWidth;
            this.slider.classList.remove("scroll--behavior");
        }

        // update currentPage
        this.currentPage =
            (Math.round(this.slider.scrollLeft / itemWidth) %
                this.originalItems.length) +
            1;
    }

    updateNonInfinitySlider() {
        const { scrollLeft } = this.slider;
        const { clientWidth } = this.sliderItems[0];
        this.currentPage = Math.abs(Math.round(scrollLeft / clientWidth)) + 1;

        if (this.currentPage === 1) {
            this.prevButton && this.prevButton.setAttribute("disabled", true);
        } else {
            this.prevButton && this.prevButton.removeAttribute("disabled");
        }

        if (this.currentPage === this.totalPages) {
            this.nextButton && this.nextButton.setAttribute("disabled", true);
        } else {
            this.nextButton && this.nextButton.removeAttribute("disabled");
        }
    }

    update() {
        if (this.dataset.loop == "false") this.updateNonInfinitySlider();
        else this.updateInfinitySlider();

        this.pagination !== null
            ? this.updatePagination()
            : this.activatePage(this.currentPage);

        this.unsetSlideActive();
        this.setSlideActive();
        // call pause all media
        this._stopMedia();

        if (!this.pageCount || !this.pageTotal) return;
        this.pageCount.textContent = this.currentPage;
        this.pageTotal.textContent = this.totalPages;
    }

    onButtonClick(event) {
        const button = event.currentTarget;

        event.preventDefault();
        this.goTo(button.name);
    }

    goTo(name) {
        const width = this.sliderItems[0]?.clientWidth;

        let direction = document.dir === "rtl" ? -1 : 1;

        if (name === "next") {
            direction = direction * 1;
        } else {
            direction = direction * -1;
        }

        this.sliderScrollTo({
            left: this.slider.scrollLeft + direction * width,
        });
        this.stop();
        this.play();
    }

    updatePagination() {
        const pages = this.pagination.children;

        // implement pagination update with throttle
        if (Date.now() - this.lastPaginationUpdate > 100) {
            let index = 0;

            for (let page of pages) {
                if (index >= this.totalPages) page.setAttribute("hidden", true);
                else page.removeAttribute("hidden");

                index++;
            }

            this.activatePage(this.currentPage);
            this.lastPaginationUpdate = Date.now();
        }
    }

    activatePage(pageNumber) {
        const name = "page-active";
        const pages = this.pagination && this.pagination.children;
        const direction = document.dir === "rtl" ? -1 : 1;

        if (!pages) return;

        var page, pageLeft, pageTop;

        // remove active class from all pages
        for (page of pages) {
            page.classList.remove(name);
        }

        page = pages[pageNumber - 1];
        if (!page) return;

        // add active class to specific page
        page.classList.add(name);

        // check is page is fully visible
        pageLeft = page.offsetLeft - direction * this.pagination.scrollLeft;
        if (
            pageLeft > this.pagination.clientWidth - page.clientWidth ||
            pageLeft < 0
        ) {
            this.pagination.scrollTo({
                left: page.offsetLeft,
            });
        }

        pageTop = page.offsetTop - this.pagination.scrollTop;
        if (
            pageTop > this.pagination.clientHeight - page.clientHeight ||
            pageTop < 0
        ) {
            this.pagination.scrollTo({
                top: page.offsetTop,
            });
        }
    }

    activateSlide(slideIndex) {
        const slide = this.sliderItems[slideIndex];

        if (!slide) return;

        this.sliderScrollTo({
            left: slide.offsetLeft,
        });
        // call pause all media
        this._stopMedia();
    }

    showLoader(slide) {
        if (
            !slide.querySelector(".media > img") ||
            slide.closest("ul").classList.contains("testimonials")
        )
            return;

        const media = slide.querySelector(".media");
        const img = slide.querySelector("img");

        if (slide.querySelector(".loading-overlay"))
            media.classList.add("loading");
        else {
            const html = document.getElementById(
                "template__loading-overlay"
            )?.innerHTML;
            if (html) {
                media.insertAdjacentHTML(
                    "beforebegin",
                    html.replace(" hidden", "")
                );
                media.classList.add("loading");
            }
        }

        if (img.complete) this.hideLoader(img);
        else {
            img.addEventListener("load", () => this.hideLoader(img), {
                once: true,
            });
            img.addEventListener("error", () => this.hideLoader(img), {
                once: true,
            }); // in case of failure
        }
    }

    hideLoader(img) {
        const media = img.closest(".media");
        media.classList.remove("loading");

        if (media.previousElementSibling.classList.contains("loading-overlay"))
            media.previousElementSibling.classList.add("hidden");
    }

    _stopMedia() {
        (async () =>
            (
                await import(window._resolveImport?.("helper") || "helper")
            ).pauseAllMedia())();
    }

    play() {
        const wait = parseFloat(this.dataset.autoplay);

        if (!wait || isNaN(wait)) {
            return;
        }

        if (this.sliderItems.length < 1) {
            return;
        }

        this.#play = setInterval(() => {
            const direction = document.dir === "rtl" ? -1 : 1;
            const scrollLeft =
                this.slider.scrollLeft +
                direction * this.sliderItems[0].clientWidth;
            const isLastPage =
                this.dataset.loop == "false"
                    ? this.currentPage === this.totalPages
                    : false;

            if (this.dataset.loop == "false" && isLastPage) {
                this.stop();
            } else {
                this.sliderScrollTo({
                    left: isLastPage ? 0 : scrollLeft,
                });
            }
        }, wait * 1000);
        this.setDelayProperty(wait);
    }

    stop() {
        clearInterval(this.#play);
        this.setDelayProperty(0);
    }

    sliderScrollTo(options) {
        const { effectModuleSrc } = this.dataset;

        this.unsetSlideActive();
        if (effectModuleSrc) {
            import(effectModuleSrc).then((module) =>
                module.scrollTo(this, options)
            );
        } else {
            this.slider.scrollTo(options);
        }
    }

    setSlideActive() {
        const slides = Array.from(this.slider.children).filter(
            (s) => s.nodeName === "LI"
        );
        let slide;

        if (document.dir === "rtl") {
            slide = slides.find(
                (s) =>
                    this.slider.scrollLeft + this.slider.clientWidth >=
                    s.offsetLeft + s.clientWidth
            );
        } else {
            slide = slides.find((s) => this.slider.scrollLeft <= s.offsetLeft);
        }

        if (slide) {
            slide.classList.add("slide-active");
        }
    }

    unsetSlideActive() {
        Array.from(this.slider.children)
            .filter((slide) => slide.nodeName === "LI")
            .forEach((slide) => slide.classList.remove("slide-active"));
    }

    setDelayProperty(delay) {
        this.style.setProperty("--slider-component__delay", delay + "s");
    }

    disconnectedCallback() {
        if (!this.slider) return;
        this.resizeObserver.unobserve(this.slider);
        super.disconnectedCallback();
    }
}

export { SliderComponent };
