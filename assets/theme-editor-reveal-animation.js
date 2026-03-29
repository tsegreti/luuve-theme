let revealAnimation;
const loadRevealAnimation = async () => {
    const importRevealAnimation = await import(
        window?._importmap?.imports?.["reveal-animation"] || "reveal-animation"
    );

    revealAnimation = importRevealAnimation.onReveal;
};

async function updateRevealAnimation(e) {
    if (!revealAnimation) await loadRevealAnimation();
    else {
        if (e.target == document) return;
        let element = e.target.closest(".reveal-slide-in")
            ? e.target.closest(".reveal-slide-in")
            : e.target.querySelector(".reveal-slide-in");

        const revealSection = new Set([element]) || new Set([element]);
        revealAnimation(revealSection);
    }
}

const editorEvents = [
    "shopify:inspector:activate",
    "shopify:inspector:deactivate",
    "shopify:block:select",
    "shopify:block:deselect",
    "shopify:section:select",
    "shopify:section:deselect",
    "shopify:section:load",
];

editorEvents.forEach((eventName) => {
    document.addEventListener(eventName, (e) => {
        updateRevealAnimation(e);
    });
});
