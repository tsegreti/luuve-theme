const revealObserver = new IntersectionObserver((entries) => {
    entries
        .filter((entry) => entry.isIntersecting)
        .forEach((entry) => {
            window.requestAnimationFrame(() => {
                entry.target.classList.add("start-animation");
            });
            revealObserver.unobserve(entry.target);
        });
});

document
    .querySelectorAll(".with-reveal-animation")
    .forEach((element) => revealObserver.observe(element));
