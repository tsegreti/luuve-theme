const { ModalDialog } = await import(
    window?._importmap?.imports?.["modal-dialog"] || "modal-dialog"
);

class PopupBanner extends ModalDialog {
    constructor() {
        super();
        if (this.dataset.showup == "exit_intent") {
            document.addEventListener(
                "mouseout",
                function (event) {
                    if (
                        !event.toElement &&
                        !event.relatedTarget &&
                        event.target.nodeName !== "INPUT"
                    ) {
                        this.show();
                    }
                }.bind(this)
            );
        } else {
            this.show();
        }
        this.addEventListener("click", (event) => {
            if (event.target.nodeName === "POPUP-BANNER") this.hide();
        });

        this.querySelector('[id^="ModalClose-"]').addEventListener(
            "click",
            (event) => {
                this.setLastShown(parseInt(this.dataset.shownUtc));
            }
        );
    }

    #isSameDay(timestamp) {
        return new Date(timestamp).toDateString() == new Date().toDateString();
    }

    #isSameWeek(timestamp) {
        var millisecondsPerDay = 24 * 60 * 60 * 1000,
            now = Date.now();
        if ((now - timestamp) / millisecondsPerDay > 7) {
            // Difference between dates more then 7 days.
            return false;
        }
        if (new Date(timestamp).getDay() > new Date(now).getDay()) {
            // Day of the week is greater that today's day.
            return false;
        }

        return true;
    }

    #show(isForced) {
        const dialog = this.querySelector("[role=dialog]");

        dialog &&
            dialog.style.setProperty(
                "--clientHeight",
                dialog.clientHeight + "px"
            );
        super.show();
        this.dataset.shownUtc = Date.now();
    }

    show(isForced) {
        if (this.isAllowed() || isForced) {
            (async () => {
                const { deferredItems, load } = await import(
                    window?._importmap?.imports?.["deferred"] || "deferred"
                );

                if (load("popupBannerCss")) {
                    await deferredItems.popupBannerCss.promise;
                }

                this.#show(isForced);
            })();
        }
    }

    setLastShown(timestamp) {
        var data = this.getData();

        if (!this.dataset.id) return;

        data[this.dataset.id] = {
            lastShown: timestamp,
        };
        localStorage.setItem("argento_popup_banner", JSON.stringify(data));
    }

    getData() {
        var data, e;

        try {
            data = JSON.parse(localStorage.getItem("argento_popup_banner"));
        } catch (e) {
            data = {};
        }

        return data || {};
    }

    getLastShown() {
        return this.getData()[this.dataset.id]?.lastShown || 0;
    }

    isAllowed() {
        var isAllowed = false,
            lastShown = this.getLastShown();

        if (this.disabled) {
            isAllowed = false;
        } else if (this.dataset.frequency === "daily") {
            isAllowed = !this.#isSameDay(lastShown);
        } else if (this.dataset.frequency === "weekly") {
            isAllowed = !this.#isSameWeek(lastShown);
        }

        return isAllowed;
    }
}

export { PopupBanner };
