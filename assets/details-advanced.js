document.body.addEventListener("click", (event) => {
    const summary = event.target.closest("summary");
    const details = summary && summary.parentElement;
    const bodyClick = (event) => {
        if (!details.contains(event.target)) {
            close();
        }
    };
    const bodyKeydown = (event) => {
        if (event.code.toUpperCase() === "ESCAPE") close(summary);
    };
    const close = async (elementToFocus = null) => {
        const { removeTrapFocus } = await import(
            window?._importmap?.imports?.["helper"] || "helper"
        );

        summary.parentElement.classList.remove("open");
        setTimeout(() => {
            details.open = false;
        }, 400);
        document.body.removeEventListener("click", bodyClick);
        document.body.removeEventListener("keydown", bodyKeydown);
        removeTrapFocus(elementToFocus);
    };

    if (details && details.dataset.advanced === "true") {
        if (details.open) {
            // details element is now opened. It means element is closing.
            event.stopPropagation();
            event.preventDefault();
            close(summary);
        } else {
            // details element is now closed. It means element is opening.
            window.requestAnimationFrame(() => {
                summary.parentElement.classList.add("open");
                document.body.addEventListener("click", bodyClick);
                document.body.addEventListener("keydown", bodyKeydown);
                setTimeout(async () => {
                    const { trapFocus } = await import(
                        window?._importmap?.imports?.["helper"] || "helper"
                    );

                    trapFocus(summary.nextElementSibling);
                }, 200);
            });
        }
    }
});
