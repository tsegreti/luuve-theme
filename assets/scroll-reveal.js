const onReveal = (elements) => {
    const minDelay = 0.075;
    const maxDelay = 0.9;
    const options = {
        root: null,
        rootMargin: "100px",
        threshold: 0.15,
    };
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            // activate reveal class
            entry.target.classList.add("reveal-ready");
            observer.unobserve(entry.target);
        });
    }, options);

    elements?.forEach((element, i) => {
        if (!element) return;
        const childs = element.querySelectorAll(".reveal-item");
        if (!childs.length) return;
        /*
         * observe element childs
         * set element's childs delay
         */
        childs.forEach((child, i) => {
            observer.observe(child);
            let currentDelay = i * minDelay;
            // reset delay value when many reveal items available on the page
            if (currentDelay > maxDelay) {
                const stepsBeforeReset = Math.floor(maxDelay / minDelay);
                const newIndex = i % stepsBeforeReset;

                currentDelay = newIndex * minDelay;
            }
            child.style.animationDelay = `${currentDelay}s`;

            child.addEventListener(
                "mouseenter",
                () => (child.style.zIndex = "10"),
                { passive: true }
            );
            child.addEventListener(
                "mouseleave",
                () => child.style.removeProperty("z-index"),
                { passive: true }
            );
        });
    });
};

const initialize = async () => {
    const elements = document.querySelectorAll(".reveal-slide-in");
    elements.length && (await onReveal(elements));
};

document.addEventListener("DOMContentLoaded", () => {
    initialize();
});
initialize();

export { initialize, onReveal };
