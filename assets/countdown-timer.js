class CountdownTimer extends HTMLElement {
    constructor() {
        super();

        this.timer = this.querySelector("#timer");

        if (!this.timer) return;
        this.dayStarts = JSON.parse(this.timer.dataset?.dayStarts);
        this.hoursStart = JSON.parse(this.timer.dataset?.hoursStart);

        if (this.dayStarts == 0 && this.hoursStart == 0) return;

        this.initTimer();
    }

    initTimer() {
        const d = this.timer.querySelector(".days");
        const h = this.timer.querySelector(".hours");
        const m = this.timer.querySelector(".minutes");
        const s = this.timer.querySelector(".seconds");

        // Calculate the countdown date by adding the specified number of days and the desired hours to start from
        let countDownDate = new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            new Date().getDate() + this.dayStarts,
            this.hoursStart,
            0,
            0,
            0
        ).getTime();

        const timer = setInterval(function () {
            // Get today's date and time
            let distance,
                days,
                hours,
                minutes,
                seconds,
                now = new Date().getTime();

            // Find the distance between now and the count down date
            distance = countDownDate - now;

            // Time calculations for days, hours, minutes and seconds
            days = Math.floor(distance / (1000 * 60 * 60 * 24));
            hours = Math.floor(
                (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
            );
            minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            seconds = Math.floor((distance % (1000 * 60)) / 1000);

            // render timer
            d.innerHTML = days;
            h.innerHTML = hours;
            m.innerHTML = minutes;
            s.innerHTML = seconds;

            // If the count down is finished
            if (distance < 0) {
                clearInterval(timer);
                d.innerHTML = "00";
                h.innerHTML = "00";
                m.innerHTML = "00";
                s.innerHTML = "00";
            }
        }, 1000);
    }
}

export { CountdownTimer };
