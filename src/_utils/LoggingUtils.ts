export class LoggingUtil {
    logging
    constructor() {
        this.logging = false
    }

    toggleLogging() {
        this.logging = !this.logging
        console.log(`Logging is now ${this.logging}`)
        return this.logging
    }
}