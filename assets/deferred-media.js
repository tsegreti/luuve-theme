const { pauseAllMedia } = await import(
    window?._importmap?.imports?.["helper"] || "helper"
);

class DeferredMedia extends HTMLElement {
    constructor() {
        super();
        this.button = this.querySelector('[id^="Deferred-Poster-"]');
        this.handleClick = this.loadContent.bind(this);
    }

    connectedCallback() {
        this.button?.addEventListener?.("click", this.handleClick);
    }

    loadContent() {
        pauseAllMedia();
        if (!this.getAttribute("loaded")) {
            const content = document.createElement("div");
            content.appendChild(
                this.querySelector(
                    "template"
                ).content.firstElementChild.cloneNode(true)
            );

            this.setAttribute("loaded", true);
            this.appendChild(
                content.querySelector("video, model-viewer, iframe")
            ).focus();
        }
    }

    disconnectedCallback() {
        this.button?.removeEventListener?.("click", this.handleClick);
    }
}

export { DeferredMedia };
