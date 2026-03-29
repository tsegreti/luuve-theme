(() => {
    const ENDURO_PRESET = "enduro";
    const USE_COLOR = window.SHOPIFY_ACTIVE_PRESET === ENDURO_PRESET;

    document.querySelectorAll(".text-color-animation").forEach((container) => {
        if (window.innerWidth < 990) return;

        const paragraph = container.querySelector("p");
        if (!paragraph) return;

        const textArray = paragraph.textContent.split("");
        paragraph.innerHTML = textArray
            .map((char) => `<span>${char}</span>`)
            .join("");

        const spans = paragraph.querySelectorAll("span");

        const startColor = [218, 250, 70];
        const endColor = [144, 144, 144];

        const lerp = (a, b, t) => a + (b - a) * t;
        const lerpColor = (start, end, t) =>
            `rgb(${lerp(start[0], end[0], t)}, ${lerp(
                start[1],
                end[1],
                t
            )}, ${lerp(start[2], end[2], t)})`;

        function revealSpans() {
            const parentTop = paragraph.getBoundingClientRect().top;

            spans.forEach((span) => {
                const { top, left } = span.getBoundingClientRect();

                if (!USE_COLOR) {
                    span.style.opacity = 0.1;
                } else {
                    span.style.opacity = 1;
                }

                if (parentTop < window.innerHeight * 0.7) {
                    let progress =
                        1 -
                        ((top - window.innerHeight * 0.6) * 0.01 +
                            left * 0.001);

                    progress = Math.min(1, Math.max(0.1, progress));

                    if (USE_COLOR) {
                        span.style.transition = "color 0.3s ease 30ms";
                        span.style.color = lerpColor(
                            startColor,
                            endColor,
                            progress
                        );
                    } else {
                        span.style.transition = "opacity 0.3s ease 30ms";
                        span.style.opacity = progress.toFixed(3);
                    }
                }
            });
        }

        window.addEventListener("scroll", revealSpans);
        revealSpans();
    });
})();
