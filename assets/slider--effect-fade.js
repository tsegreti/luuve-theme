document.head.insertAdjacentHTML(
    "beforeend",
    '<style id="slider--fade-effect">' +
        ".slider.slider--effect-fade{scroll-behavior: auto !important; overflow: hidden !important;}" +
        ".slider__slide :is(img, video, iframe) ~ :is(img, video, iframe) {visibility: hidden;}" +
        ".slider__slide .fade--transition:is(img, video, iframe) {" +
        "visibility:visible;" +
        "opacity:0;" +
        "transition-property:opacity;" +
        "transition-timing-function:cubic-bezier(.4,0,.2,1);" +
        "transition-duration: 1s;" +
        "}" +
        "</style>"
);

const _getElementTransitionDurationMs = (element) => {
    const { transitionDuration } = window.getComputedStyle(element);
    const _float = parseFloat(transitionDuration);

    return isNaN(_float)
        ? 0
        : _float * (transitionDuration.indexOf("ms") > 0 ? 1 : 1000);
};

// copy images from next and previous slides
// to make them fade after instant scroll
const _copyImages = (items) => {
    let html = [...items].map(
        (item) => item?.querySelector?.("div.image--wrapper")?.innerHTML
    );

    for (let i = items.length - 1; i >= 0; i--) {
        items[i]
            ?.querySelector?.("div.image--wrapper")
            ?.insertAdjacentHTML?.(
                "beforeend",
                (html[i - 1] || (i === 0 ? html[items.length - 1] : "")) +
                    (html[i + 1] || "")
            );

        let images = items[i].querySelectorAll(
            [
                "div.image--wrapper > img",
                "div.image--wrapper > video",
                "div.image--wrapper > iframe",
            ].join(",")
        );

        (images[2] || images[1])?.classList?.add?.("fade--on-prev");
        images[1]?.classList?.add?.("fade--on-next");
    }
};

const _transition = (img) => {
    img.classList.add("fade--transition");

    setTimeout(
        () => img.classList.remove("fade--transition"),
        _getElementTransitionDurationMs(img) + 100
    );
};

const scrollTo = (component, options) => {
    if (!component._imagesCopied) {
        _copyImages(component.sliderItems);
        component._imagesCopied = true;
    }

    window.requestAnimationFrame(() => {
        const { slider } = component;
        const isRtl = document.dir == "rtl";
        const onNext = ".fade--on-next";
        const onPrev = ".fade--on-prev";

        if (isRtl) {
            if (options.left < slider.scrollLeft) {
                slider.querySelectorAll(onNext).forEach(_transition);
            } else {
                let { scrollLeft, scrollWidth } = slider;
                let { clientWidth: slideWidth } = component.sliderItems[0];
                let isLast = -1 * scrollLeft + slideWidth >= scrollWidth;

                if (
                    isLast &&
                    component.dataset.loop === "true" &&
                    options.left === 0
                ) {
                    slider.querySelectorAll(onNext).forEach(_transition);
                } else {
                    slider.querySelectorAll(onPrev).forEach(_transition);
                }
            }
        } else {
            if (options.left > slider.scrollLeft) {
                slider.querySelectorAll(onNext).forEach(_transition);
            } else {
                let { scrollLeft, scrollWidth } = slider;
                let { clientWidth: slideWidth } = component.sliderItems[0];
                let isLast = scrollLeft + slideWidth >= scrollWidth;

                if (
                    isLast &&
                    component.dataset.loop === "true" &&
                    options.left === 0
                ) {
                    slider.querySelectorAll(onNext).forEach(_transition);
                } else {
                    slider.querySelectorAll(onPrev).forEach(_transition);
                }
            }
        }

        slider.scrollTo(options);
    });
};

const addSwipeListener = (element, cbLeft, cbRight) => {
    let x1 = null;
    let y1 = null;

    const _handleTouchStart = (event) => {
        const firstTouch = event.touches[0];

        x1 = firstTouch.clientX;
        y1 = firstTouch.clientY;
    };

    const _handleTouchEnd = (event) => {
        if (!x1 || !y1) return;

        const { target } = event;
        const { scrollLeft, scrollWidth } = target;
        const sliderComponent = event.target.closest("slider-component");
        const isLoop = Boolean(sliderComponent.dataset.loop);
        const x2 = event.changedTouches[0].clientX;
        const y2 = event.changedTouches[0].clientY;

        const xDiff = x2 - x1;
        const yDiff = y2 - y1;

        if (Math.abs(xDiff) > Math.abs(yDiff)) {
            // Horizontal swipe
            if (xDiff > 0) cbRight();
            else cbLeft();
        }

        // Reset
        x1 = null;
        y1 = null;
    };

    element.addEventListener("touchstart", _handleTouchStart, {
        passive: true,
    });
    element.addEventListener("touchend", _handleTouchEnd);
};

export { scrollTo, addSwipeListener };
